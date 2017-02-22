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

GET: /api/v1/indicator/:indicatorId?iso=year -> Return the statistics for the indicator for this country and year. You can filter by several countries and years

GET: /api/v1/indicator/:country/:year -> Return the statistics for all indicators of the poll selected with country and year
