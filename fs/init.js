/**
* Load timer api
*/
load('api_timer.js');
/**
* Load GPIO api
*/
load('api_gpio.js');
/**
* Load mq api
*/
load('api_mq135.js');
/**
* Load influxdb
*/
load('api_influxdb.js');

/**
* Built-in LED GPIO pin configuration
*/
let led = ffi('int get_led_gpio_pin()')();
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.write(led,0);

 // Set InfluxDB parameters
 var influxDBParams = {
    DBHost: "http://localhost",          // Host IP address or URL without "http://".
    Port: 8086,                   // InfluxDB server port.
    DBName: "testDataBase",       // Database name (measurement).
    UserName: "toto",             // User name account (must have write permission).
    Password: "root",             // User password.
    AgentName: "MONGOOSE-OS"         // Device name in HTTP headers.
   };

// Configure InfluxDB
InfluxDB.setConfig(influxDBParams);

// Create new database named 'mq135'
var query = 'q=CREATE DATABASE mq135\n';
InfluxDB.query(query);
print('Database created');


/**
* Read and print value of CO2 in ppm
* Call every 10 second
*/
Timer.set(10000, true, function() {

print('############################ Begin ############################\n');

GPIO.toggle(led);

rzero = MQ.MQ135.getRZero();
correctedRZero = MQ.MQ135.getCorrectedRZero(temperature, humidity);
resistance = MQ.MQ135.getResistance();
ppm = MQ.MQ135.getPPM();
correctedPPM = MQ.MQ135.getCorrectedPPM(temperature, humidity);

print('MQ135 RZero: ',rzero,' Corrected RZero: ',correctedRZero,'\n');
print('Resistance: ',resistance," kohm\n");
print('PPM: ',ppm,' Corrected PPM: ',correctedPPM,' ppm\n');

// https://docs.influxdata.com/influxdb/v1.3/guides/writing_data/
//Measurement name|tag key = name| field key = value    | timestamp (optional)
let data = 'smoke ,device=ESP0001, value='+correctedPPM+' 14340555620000000\n';
InfluxDB.write(data);

// https://docs.influxdata.com/influxdb/v1.3/guides/querying_data/
// Get JSON data from InfluxDB Server
let query = 'q=SELECT \"mq135\" FROM \"smoke\" WHERE \"device\"='ESP0001'\n';
let data = InfluxDB.query(query);
print(data);


print('############################ End ##############################\n');

}, null);
