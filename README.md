# i2i API

## Endpoints

GET: /api/v1/country -> Return all countries with its years

 QueryParam   |      Description      |  Example |
|----------|:-------------:|------|
| lastyear | return only last year | 'true' |

Example:

```json

GET /api/v1/country

[
	{
	"id": 1,
	"name": "spain",
	"iso": "ESP",
	"createdAt": "2017-03-01T10:07:44.521Z",
	"updatedAt": "2017-03-01T10:07:44.521Z",
	"year": [
		{
			"id": 1,
			"year": 2009,
			"total": 222222,
			"createdAt": "2017-03-01T10:07:44.547Z",
			"updatedAt": "2017-03-01T10:07:44.547Z",
			"countryId": 1
		},
		{
			"id": 34,
			"year": 2015,
			"total": 22,
			"createdAt": "2017-03-14T10:54:16.043Z",
			"updatedAt": "2017-03-14T10:54:16.043Z",
			"countryId": 1
		}
		]
	}
]

GET /api/v1/country?lastyear=true

[
	{
	"id": 1,
	"name": "spain",
	"iso": "ESP",
	"createdAt": "2017-03-01T10:07:44.521Z",
	"updatedAt": "2017-03-01T10:07:44.521Z",
	"year": [
		{
			"id": 34,
			"year": 2015,
			"total": 22,
			"mapUrl": null,
			"createdAt": "2017-03-14T10:54:16.043Z",
			"updatedAt": "2017-03-14T10:54:16.043Z",
			"countryId": 1
		}
		]
	}
]


```

GET: /api/v1/country/:iso -> Return the country with iso of the param and all years for this country

GET: /api/v1/country/:iso/download -> Download csv with all answers

POST: /api/v1/country -> Save a new country and year. If the country already exist, only create this year for this country

```json
{
	"name": "España",
	"iso": "esp",
	"year": 2017,
	"total": 20000.2 // total of poblation
}

```

PATCH: /api/v1/country/:iso/:year -> Update data for that country and year.

```json

{
	"mapUrl": "http://link",
	"total": 200.20
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

GET: /api/v1/indicator/:indicatorId/download -> Download csv with the diferents answers of the indicator_id. You can filter by several countries and years


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
