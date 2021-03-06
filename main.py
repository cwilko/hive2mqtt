import paho.mqtt.client as mqtt
from pyhiveapi import Hive
import traceback
import os
import time
import sched

MQTT_HOST = os.environ.get('MQTT_HOST')
MQTT_PORT = int(os.environ.get('MQTT_PORT'))
INTERVAL = int(os.environ.get('INTERVAL'))
HIVE_USERNAME = os.environ.get('HIVE_USERNAME')
HIVE_PASSWORD = os.environ.get('HIVE_PASSWORD')


def mqttSvc(client, device, deviceType, attributes):
    normalisedName = device.replace(" ", "_")

    fieldString = getFields(device, attributes)
    tagString = "device=" + normalisedName + ",type=" + deviceType
    payload = "hive," + tagString + " " + fieldString

    try:

        #print("telegraf/hive/" + normalisedName, payload)
        client.publish("telegraf/hive/" + normalisedName, payload)

    except Exception as e:
        print("Error during publish")
        print(e)
        traceback.print_exc()


valueMap = {
    "OFF": 0,
    "ON": 1,
    "ABSENT": 0,
    "PRESENT": 1,
    "DOWN": 0,
    "UP": 1,
    "DISCONNECTED": 0,
    "CONNECTED": 1,
    "UNKNOWN": 0,
    "wired": 1,
    "True": 1,
    "False": 0,
    "Online": 1,
    "Offline": 0,
    "None": 0
}


def getFields(device, attributes):
    fieldString = ""

    for attribute in attributes:
        if str(attributes[attribute]) in valueMap.keys():
            fieldString += attribute + "=" + str(valueMap[str(attributes[attribute])]) + ","
        else:
            fieldString += attribute + "=" + str(attributes[attribute]) + ","

    return fieldString[:-1]


def getHiveMetrics(sc):

    print("Initiating data capture...")

    try:
        session = Hive(username=HIVE_USERNAME, password=HIVE_PASSWORD)
        session.login()
        session.startSession()

        for deviceType in session.deviceList:
            for device in session.deviceList[deviceType]:
                #print(device["hiveName"], device["hiveID"])

                # Hub
                if (deviceType == 'binary_sensor') and (device['hiveName'] == 'Hub'):
                    mqttSvc(client, "Hub", "device", {
                        'presence': device['deviceData']['online'],
                        'deviceState': session.sensor.getSensor(device)['status']['state'],
                        'serverConnectionState': device['deviceData']['connection']
                    })

                # Water Heating Thermostat
                elif (deviceType == 'water_heater' and device['hiveType'] == 'hotwater'):
                    mqttSvc(client, "Hot Water", "heat", {
                        'stateHotWaterRelay': session.hotwater.getState(device)
                    })

                # Central Heating Thermostat
                elif (deviceType == 'climate' and device['hiveType'] == 'heating'):
                    mqttSvc(client, "Heating", "heat", {
                        'temperature': session.heating.getCurrentTemperature(device),
                        'targetHeatTemperature': session.heating.getTargetTemperature(device),
                        'stateHeatingRelay': session.heating.getState(device)
                    })

                # Thermostat Device properties
                elif (deviceType == 'sensor' and device['hiveType'] == 'Battery'):
                    mqttSvc(client, "Thermostat", "device", {
                        'presence': device['deviceData']['online'],
                        'signal': device['deviceData']['online'],
                        'batteryLevel': device['deviceData']['battery']
                    })

                # Lights
                elif (deviceType == 'light'):
                    mqttSvc(client, device["hiveName"], "light", {
                        'presence': device['deviceData']['online'],
                        'state': session.light.getState(device) if device['deviceData']['online'] else 0,
                        'brightness': session.light.getBrightness(device) if device['deviceData']['online'] else 0
                    })

    except Exception as e:
        print("Error getting Hive metrics")
        print(e)
        traceback.print_exc()

    finally:
        s.enter(INTERVAL, 1, getHiveMetrics, (sc,))


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT with result code " + str(rc))

client = mqtt.Client()
client.on_connect = on_connect

client.connect(MQTT_HOST, MQTT_PORT, 60)
client.loop_start()

# Kick off timers
s = sched.scheduler(time.time, time.sleep)

s.enter(INTERVAL, 1, getHiveMetrics, (s,))
s.run()
