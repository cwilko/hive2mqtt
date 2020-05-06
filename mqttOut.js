'use strict';

const valueMap = {
    "OFF": 0,
    "ON": 1,
    "ABSENT": 0,
    "PRESENT": 1
}

const valueMapKeys = Object.keys(valueMap)

module.exports = (client, item, attributeList) => {   

    const normalisedName = item.name.replace(/\s/g, '\\ ');

    const fieldString = getFields(item, attributeList);
    const tagString = "device=" + normalisedName

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

    item.name.replace(/ABSENT/g, '0').replace(/ABSENT/g, '0').replace(/OFF/g, '0').replace(/ON/g, '0')

    return fieldString.slice(0, -1);
}

