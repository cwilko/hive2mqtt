'use strict';

const valueMap = {
    "OFF": 0,
    "ON": 1,
    "ABSENT": 0,
    "PRESENT": 1,
    "DOWN": 0,
    "UP": 1, 
    "DISCONNECTED": 0,
    "CONNECTED": 1,
    "UNKNOWN": 0
}

const valueMapKeys = Object.keys(valueMap)

module.exports = (client, item, attributeList, light=false) => {   

    const normalisedName = item.name.replace(/\s/g, '\\ ');

    const fieldString = getFields(item, attributeList);
    var tagString = "device=" + normalisedName

    if (light == true) 
        tagString += ",type=light"
    else
        tagString += ",type=heat"

    const payload = "hive," + tagString + " " + fieldString

    if (client.connected == true) {
        client.publish("telegraf/hive/"+normalisedName, payload);
    } else
        console.log("Error: Cannot publish. MQTT disconnected")
}

function getFields(item, attributeList) {

    var fieldString = ""

    attributeList.forEach(attribute => {
        if (item.attributes[attribute]) {
            var value = item.attributes[attribute].reportedValue
            if (valueMapKeys.includes(value))
                value = valueMap[value];
            fieldString += attribute + "=" + value + ",";
        }
    });

    return fieldString.slice(0, -1);
}

