'use strict';

const cron = require('node-cron');
const login = require('./login');
const getNodes = require('./getNodes');
const mqttOut = require('./mqttOut');

var mqtt = require('mqtt')

console.log("Initiating cron job...")

if (!process.env.HIVE_USERNAME && !process.env.HIVE_PASSWORD){
    logger.error("No username and / or password set")
} else {
    cron.schedule('*/5 * * * *', () => {

        login().then(getNodes).then((result) => {

            var client  = mqtt.connect('mqtt://192.168.1.202')

            client.on('connect', function () {

                console.log("Connected to MQTT broker")

                result.nodes.forEach(item => {
                    if (item.name.indexOf('http://') == -1){                    
                        //console.log(item.name, item.id);
                        //console.log(item.attributes);
                        // Hub
                        if (item.name === 'Hub'){
                            mqttOut(client, item, ["presence", "devicesState", "serverConnectionState"]);
                        } else 
                        // Receiver
                        if (item.name === 'Receiver 1'){
                            mqttOut(client, item, ["presence"]);
                        } else 
                        // Water Heating Thermostat
                        if (item.name === 'Thermostat 1'){
                            mqttOut(client, item, ["stateHotWaterRelay"]);                            
                        } else 
                        // Central Heating Thermostat
                        if (item.name === 'Thermostat 2'){
                            mqttOut(client, item, ["temperature", "targetHeatTemperature", "stateHeatingRelay"]);
                        } else 
                        // Thermostat Device properties
                        if (item.name === 'Thermostat 3'){
                            mqttOut(client, item, ["presence", "batteryLevel"]);                            
                        } else 
                        // Lights
                        if (item.attributes.brightness) {
                            mqttOut(client, item, ["presence", "state", "brightness"], true);                        
                        }
                    }
                });

                client.end();
          
            })

        }).catch(err => {
            console.log(err);
        });            

    });
}
