Charting API
============
## DevDev.Pi 
Insert a /dev/deviation pi chart.
```
var piChart = new DevDev.Pi({
    city: 'Minneapolis'
});
```
- Accepts an object as an argument.
- Possible option values:
    - city (Default: Minneapolis) 
        - City to display from.
    - element 
        - (Default: .pi) Dom element to attach the map to.
    - tweenTime (Default: 1000)
        - Animation duration in milliseconds.
    - thickness (Default: 30)
        - Graph thickness in pixels.

### Methods
#### DevDev.Pi.changeCity
```
piChart.changeCity('New City');

```
- Accepts a string as an argument.
