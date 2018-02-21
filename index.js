var Net      = require('net'),
    hostname = require("os").hostname();

var ZabbixSender = module.exports = function(opts) {
    opts = (typeof opts !== 'undefined') ? opts : {};

    this.host = opts.host || 'localhost';
    this.port = parseInt(opts.port) || 10051;
    this.timeout = parseInt(opts.timeout) || 5000;
    this.with_timestamps = opts.with_timestamps || false;
    this.items_host = opts.items_host || hostname;

    // prepare items array
    this.clearItems();
}

ZabbixSender.prototype.addItem = function(host, key, value = false, ts = false) {
    if (arguments.length < 3) {
        if (arguments.length < 2) {
            throw new Error('addItem requires 2 to 4 arguments');
        }

        // if just 2 args provided
        ts    = value;
        value = key;
        key   = host;
        host  = this.items_host;
    }

    var length = this.items.push({
        host:  host,
        key:   key,
        value: value
    });

    if (ts !== false) {
        // add time stamp for every items and also use nanoseconds
        this.items[length - 1].clock = parseInt(ts);
        this.items[length - 1].ns = parseInt(((parseFloat(ts)*1000000000)+"").substr((this.items[length - 1].clock+"").length));	// 1 sec = 1*10^9 nanoseconds
        this.with_timestamps = true;
    } else if (this.with_timestamps) {
        this.items[length - 1].clock = Date.now() / 1000 | 0;
    }

    return this;
}

ZabbixSender.prototype.clearItems = function() {
    this.items = [];
    return this;
}

ZabbixSender.prototype.countItems = function() {
    return this.items.length;
}

ZabbixSender.prototype.send = function(callback) {
    // make sure callback is a function
    callback = (typeof callback === 'function') ? callback : function() {};

    var self     = this,
        error    = false,
        items    = this.items,
        data     = prepareData(items, this.with_timestamps),
        client   = new Net.Socket(),
        response = new Buffer(0);

    // uncoment when debugging
    //console.log(data.slice(13).toString());

    // reset items array
    this.clearItems();

    // set socket timeout
    client.setTimeout(this.timeout);

    client.connect(this.port, this.host, function() {
        client.write(data);
    });

    client.on('data', function(data) {
        response = Buffer.concat([response, data]);
    });

    client.on('timeout', function() {
        error = new Error("socket timed out after " + self.timeout / 1000 + " seconds");
        client.destroy();
    });

    client.on('error', function(err) {
        error = err;
    });

    client.on('close', function() {
        // bail out on any error
        if (error) {
            // in case of error, put the items back
            self.items = self.items.concat(items);
            return callback(error, {});
        }

        // bail out if got wrong response
        if (response.slice(0, 5).toString() !== 'ZBXD\x01') {
            // in case of bad response, put the items back
            self.items = self.items.concat(items);
            return callback(new Error("got invalid response from server"), {});
        }

        // all clear, return the result
        callback(null, JSON.parse(response.slice(13)), items);
    });
}

// takes items array and prepares payload for sending
function prepareData(items, with_timestamps) {
    var data = {
        request: 'sender data',
        data: items
    };

    if (with_timestamps) {
        data.clock = Date.now() / 1000 | 0;
    }

    var payload = new Buffer(JSON.stringify(data), 'utf8'),
        header  = new Buffer(5 + 4); // ZBXD\1 + packed payload.length

    header.write('ZBXD\x01');
    header.writeInt32LE(payload.length, 5);
    return Buffer.concat([header, new Buffer('\x00\x00\x00\x00'), payload]);
}
