# Postman to Excel

## Setup

```bash
git clone https://github.com/DustinDiazLopez/pm.git
```

```bash
cd pm
```

```bash
npm install
```

## Usage

### postman to excel

```bash
npm run pm2xls <collection.json> <out.xlsx>
```

**NOTE:** For every item in the collection, there must be two (2) saved responses. One response must have `local` in its name and the other response must have `master` in its name. For example (recommended):

- `local-/ping/:param`
- `master-/ping/:param`

Also note that the name of the endpoint is in the name of the saved response.

### Checkmarx CSV scan report minimized

```bash
npm run chxcsv <scan-report.csv> <scan-report.min.csv>
```

### Postman diff helper

```bash
npm run diff <collection.json>
```

Must have at least two saved responses.
