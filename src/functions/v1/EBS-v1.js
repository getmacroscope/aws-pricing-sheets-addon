function EC2_EBS_GB(settingsOrVolumeType, volumeTypeOrVolumeSize, volumeSizeOrRegion, region) {
  if(typeof settingsOrVolumeType === "string") {
    return getHourlyPriceEBS({
      volumeType: settingsOrVolumeType, 
      volumeSize: volumeTypeOrVolumeSize, 
      region: volumeSizeOrRegion, 
      storageType: "storage"
    }
  )
  } else { // first argument is a range selected from the sheet with settings
    [ settings, 
      volumeType,
      volumeSize
    ] = [settingsOrVolumeType, volumeTypeOrVolumeSize, volumeSizeOrRegion]
    return EC2_EBS_FROM_SETTINGS({settings, volumeType, storageType: "storage", volumeSize, region})
  }
}

function EC2_EBS_SNAPSHOT_GB(a, b, c) {
  return EC2_EBS(null, "snapshot", a, b, c);
}

function EC2_EBS_IO1_IOPS(a, b, c) {
  return EC2_EBS('io1', 'iops', a, b, c);
}

function EC2_EBS_IO2_IOPS(a, b, c) {
  return EC2_EBS('io2', 'iops', a, b, c);
}

function EC2_EBS_GP3_IOPS(a, b, c) {
  return EC2_EBS('gp3', 'iops', a, b, c);
}

function EC2_EBS(volumeType, storageType, a, b, c) {
  if(typeof a === "string" || typeof a === "number") {
    const [volumeSize, region] = [a, b];
    return getHourlyPriceEBS({ volumeType, storageType, volumeSize, region });
  }

  // else
  let [settings, volumeSize, region] = [a, b, c];
  return EC2_EBS_FROM_SETTINGS({settings, volumeType, storageType, volumeSize, region})
}

function EC2_EBS_FROM_SETTINGS({settings, volumeType, storageType, volumeSize, region}) {
  if ((!storageType || storageType.toString().toLowerCase() !== "snapshot") && !getVolumeTypeFullName(volumeType)) {
    throw `invalid EBS volume type`
  }
  
  settings = map2dArrayToObjectWithLowerCaseValues(settings);

  return getHourlyPriceEBS({
    volumeType,
    volumeSize, 
    region: region || settings.region, 
    storageType
  });
}