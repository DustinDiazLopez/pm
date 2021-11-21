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

```bash
npm pm2xls <collection.json> <out.xlsx>
```

**NOTE:** For every item in the collection, there must be two (2) saved responses. One response must have `local` in its name and the other response must have `master` in its name. For example:

- `local-/ping/:param`
- `master-/ping/:param`

Also note that the name of the endpoint is in the name of the saved response. 
