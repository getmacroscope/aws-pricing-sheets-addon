function RDS_STORAGE_GB(settingsOrType, typeOrSize, sizeOrRegion, region) {
  if(Array.isArray(settingsOrType)) {
    return RDS_STORAGE_FROM_SETTINGS({
      settings: settingsOrType, 
      storageType: typeOrSize, 
      storageSize: sizeOrRegion, 
      region
    });
  } else {
    return fetchApiRDSStorage({
      storageType: settingsOrType,
      storageSize: typeOrSize,
      region: sizeOrRegion
    });
  }
}

function RDS_STORAGE_FROM_SETTINGS({settings, storageType, storageSize, region}) {
  if(!settings) throw 'Must specify a parameter';
  settings = map2dArrayToObjectWithLowerCaseValues(settings);

  return fetchApiRDSStorage({
    region: region || settings.region, 
    storageType,
    storageSize
  });
}

function fetchApiRDSStorage(options) {
  options = getObjectWithValuesToLowerCase(options);
  const { storageType, storageSize, region } = options;

  if(!storageType) throw `Must specify storage type`;
  if(!storageTypeStr(options.storageType)) throw 'Invalid storage type';
  if(!storageSize) throw `Must specify storage size`;
  if(!region) throw 'Missing region';
  if(isNaN(parseFloat(storageSize))) throw 'Invalid storage size';

  const path = '/pricing/1.0/rds/database-storage/index.json';
  const url = `${cfg.baseHost}${path}`;
  let response;
  try {
    response = JSON.parse(fetchUrlCached(url));
  } catch(err) {
    throw 'We encountered a problem while fetching the price. Please try again later.'
  }   
  const prices = filterRDSStorage(response.prices, options);

  if (prices.length === 0)
    throw `Can not find price for RDS storage type ${storageTypeStr(storageType)} from storageType ${storageType}`
  if (prices.length > 1)
      throw `Too many matches for RDS storage type ${storageTypeStr(storageType)} from storageType ${storageType}`
  
  const price = prices[0].price.USD;
  return parseFloat(price) * parseFloat(storageSize) / cfg.hoursPerMonth;
}

function filterRDSStorage(prices, options) {
  return prices.filter(price => 
          // price.attributes['aws:productFamily'] === 'Database Storage' && // this attribute is left out, and is already filtered out
          price.attributes['aws:deploymentOption'] === 'Single-AZ' &&
          price.attributes['aws:rds:dbEngine'] === 'Any' &&
          price.attributes['aws:region'] === options.region &&
          price.attributes['aws:rds:volumetype'] === storageTypeStr(options.storageType)
  )
}

function storageTypeStr(storageType) {
  const storageTypeLib = {
    'gp2': 'General Purpose',
    'piops': 'Provisioned IOPS',
    'magnetic': 'Magnetic',
    'aurora': 'General Purpose-Aurora',
  };
  return storageTypeLib[storageType];
}