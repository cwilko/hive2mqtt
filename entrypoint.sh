#! /bin/ash

run(){
    while true; do 
        echo "Starting NodeJS process" 
        node index.js
        sleep 60
    done
}

run & wait $! # handle sigterm