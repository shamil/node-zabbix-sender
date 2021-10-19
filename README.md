### About this library

The library is an implementation of `zabbix_sender` utility, which sends items data to zabbix server
using the zabbix `trapper` protocol. Because the library is a pure Node.js/Javascript implementation, it doesn't
require invocation of `zabbix_sender` utility. So there is no any `child_process` involved!

### Basic usage example

```javascript
var ZabbixSender = require('node-zabbix-sender');
var Sender = new ZabbixSender({host: 'zabbix.example.com'});

// Add items to request
Sender.addItem('webserver', 'httpd.running', 0);
Sender.addItem('dbserver', 'mysql.ping', 1);

// Add item with default host
Sender.addItem('httpd.logs.size', 1024);

// Add item with timestamp 
Sender.addItem('webserver', 'httpd.running', 1, 1634645976);

// Add item with timestamp and nanoseconds
Sender.addItem('dbserver', 'mysql.ping', 0, 1634645976, 758000000);

// Add item with default host with timestamp. The host has to be set to an empty string in this case.
Sender.addItem('','httpd.logs.size', 1024, 1634645976);

// Send the items to zabbix trapper
Sender.send(function(err, res) {
    if (err) {
        throw err;
    }

    // print the response object
    console.dir(res);
});
```

### Another example, with `addItem` & `send` combined

```javascript
var ZabbixSender = require('node-zabbix-sender');
var Sender = new ZabbixSender({host: 'zabbix.example.com'});

// addItem supports chaining
// Here is an example: add item and & send it
Sender.addItem('cpu_load', 0.15).send(function(err, res) {
    if (err) {
        throw err;
    }

    // print the response object
    console.dir(res);
});
```

### Instance options

Whenever you create a new instance of zabbix sender, you can pass an options object (e.g `new ZabbixSender(opts)`)
here are the options defaults:

```javascript
{
    host: 'localhost',
    port: 10051,
    timeout: 5000,
    with_ns: false,
    with_timestamps: false,
    items_host: require('os').hostname()
}
```
- **`host`** and **`port`** are self-explanatory, the zabbix server host & port
- **`timeout`** is a socket timeout in milliseconds, when connecting to the zabbix server
- **`with_timestamps`** when you `addItem`, timestamp will be added as well
- **`with_ns`** implies `with_timestamps`, nanoseconds portion of the timestamp seconds will be added to the item
- **`items_host`** a target monitored host in zabbix. used when you don't specify the host when you `addItem`, see example above

### Instance methods

**`addItem([host], key, value, [timestamp], [ns])`**

Adds an item to the request payload. `ns` can only be set if `host` and `timestamp` are also set.
If a custom timestamp is set, `with_timestamps` and `with_ns` are ignored. 
If `host` is an empty string `items_host` is used. The item data won't be sent until the `send` method invoked.
The `return` value is self instance, so chaining can be used.

**`clearItems()`**

Clears the previously added items (if any). Mostly used internally, but you can use this method,
if you want to make sure no orphan items are present. The `return` value is self instance, so chaining can be used.

**`countItems()`**

Just returns the number of unsent items.

**`send(callback)`**

Sends all items that were added to the request payload.
The callback function passes 3 arguments `error` (if any), the `response` from zabbix server (trapper),
and the `items` array of item objects. The `send` method **clears** items that were previously added.
In case of `error`, the previously added items will be kept, for the next `send` invocation.

### Protocol References

- https://www.zabbix.com/documentation/6.0/manual/appendix/items/trapper
- https://www.zabbix.com/documentation/6.0/manual/appendix/protocols/header_datalen

### License

Licensed under the MIT License. See the LICENSE file for details.
