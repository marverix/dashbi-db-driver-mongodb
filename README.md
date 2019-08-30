# dashbi-db-driver-mongodb

MongoDB driver for Dashbi.

## Usage

Install:

```sh
npm install --save dashbi-db-driver-mongodb
```

Then tell Dashbi to use it:

```js
const dashboard = new Dashbi({
  database: {
    driver: 'mongodb',
    settings: {
      ...
    }
  }
});
```

### Settings

Name | Type | Default | Description
--- | --- | --- | ---
host | *String* | `localhost` | MongoDB hostname
port | *Number* | `27017` | MongoDB port
dbName | *String* | `dashbi` | Database name

## Auto-clean and Limit Per Source ID

This driver has `cleanUp` method and limit per source is 1,000,000.
This means that Dashbi DatabaseController will regulary clean up each source, so there will be no more then 1 milion records per source.
