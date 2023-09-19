var ZabbixSender = require('./index');
var Sender = new ZabbixSender({
    host: 'zabbix.example.com',
    key_file_path: 'private-key.pem',
    cert_file_path: 'public-cert.pem',
    // optional socket_options
    // socket_options: {
    //     rejectUnauthorized: false,
    // }
});

// Add items to request
Sender.addItem('webserver', 'httpd.running', 0);
Sender.addItem('dbserver', 'mysql.ping', 1);

// Add item with default host
Sender.addItem('httpd.logs.size', 1024);

// Send the items to zabbix trapper
Sender.send(function(err, res) {
    if (err) {
        throw err;
    }

    // print the response object
    console.dir(res);
});