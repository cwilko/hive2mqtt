'use strict';



module.exports = data => {
    
    return "hive," +
        "dataType=" + data["dataType"] + "," +
        "device=" + normalisedName + " " +
        "value=" + data["reportedValue"];
}
