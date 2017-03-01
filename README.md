# i2i API

## Endpoints

GET: /api/v1/country -> Return all countries and his last year registered
GET: /api/v1/country/:iso -> Return the country with iso of the param and all years for this country

POST: /api/v1/country -> Save a new country and year. If the country already exist, only create this year for this country

```json
{
	"name": "España",
	"iso": "esp",
	"year": 2017,
	"total": 20000.2 // total of poblation
}
```

GET: /api/v1/indicator/:indicatorId -> Return the statistics for the indicator for this country and year. You can filter by several countries and years


Available filters as query params:

| QueryParam   |      Description      |  Example |
|----------|:-------------:|------|
| filters |  Filter by several indicators with a set of values. The value should be a Array of objects | [{"indicatorId":"gender","value":["Female","Male"]},{"indicatorId":"access_to_resources","value":["Paraffin (Lantern)  ","Firewood  "]}] |
| -- indicatorId |  Id of the indicator | 'gender' |
| -- childIndicatorId |  Array of child Indicators ids (not required) | [2, 3] |
| -- answerId |   Array of answers ids (not required) | [1, 2] |
| -- value |  Array of values (required) | ["Paraffin (Lantern)  ","Firewood  "]|
| iso-value |    Query param with key the iso of the country and value the year   |   ESP=2015 |


GET: /api/v1/indicator/:country/:year -> Return the statistics for all indicators of the poll selected with country and year

GET: /api/v1/indicator -> Returns all indicators ids.
