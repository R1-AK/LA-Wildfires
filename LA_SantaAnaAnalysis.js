// ---------------------------------------------
// Map Los Angeles Devastation from Santa Ana Winds
// Using Sentinel-2 Imagery (January 10, 2025)
// ---------------------------------------------

// Define the Box Boundary using Coordinates
var boundaryCoordsMain = ee.Geometry.Polygon([
  [
    [-119.28679363256086, 33.89937835176071],
    [-117.98766033177961, 33.89937835176071],
    [-117.98766033177961, 34.50814643679167],
    [-119.28679363256086, 34.50814643679167],
    [-119.28679363256086, 33.89937835176071] // Closing the polygon
  ]
]);

var boundaryCoordsUrban = ee.Geometry.Polygon([
  [
    [-118.57881690373861, 34.03323595790945],
    [-118.51719046941244, 34.03323595790945],
    [-118.51719046941244, 34.057771917726015],
    [-118.57881690373861, 34.057771917726015],
    [-118.57881690373861, 34.03323595790945] // Closing the polygon
  ]
]);

// Center the Map on the Main Boundary
Map.centerObject(boundaryCoordsMain, 10); // Zoom level 10 for a detailed view

// Define Event Date and Analysis Period
var eventDate = ee.Date('2025-01-10'); // Event Date: January 10, 2025
var preEventStart = eventDate.advance(-10, 'day'); // 10 days before
var preEventEnd = eventDate.advance(-1, 'day');    // 1 day before
var postEventStart = eventDate;                   // Event Date
var postEventEnd = eventDate.advance(10, 'day');  // 10 days after

// Load Sentinel-2 Surface Reflectance Imagery
function loadSentinelImages(startDate, endDate, boundary) {
  return ee.ImageCollection('COPERNICUS/S2_SR')
    .filterDate(startDate, endDate)
    .filterBounds(boundary)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Cloud cover less than 20%
    .median(); // Composite to reduce noise
}

// Pre-event and Post-event Images
var preEventImageMain = loadSentinelImages(preEventStart, preEventEnd, boundaryCoordsMain);
var postEventImageMain = loadSentinelImages(postEventStart, postEventEnd, boundaryCoordsMain);

var preEventImageUrban = loadSentinelImages(preEventStart, preEventEnd, boundaryCoordsUrban);
var postEventImageUrban = loadSentinelImages(postEventStart, postEventEnd, boundaryCoordsUrban);

// Compute Normalized Burn Ratio (NBR)
function computeNBR(image) {
  return image.normalizedDifference(['B8', 'B12']).rename('NBR'); // Near-IR and SWIR
}

// Compute Normalized Difference Vegetation Index (NDVI)
function computeNDVI(image) {
  return image.normalizedDifference(['B8', 'B4']).rename('NDVI'); // Near-IR and Red
}

// Pre-event and Post-event Indices
var preNBR = computeNBR(preEventImageMain);
var postNBR = computeNBR(postEventImageMain);

var preNDVI = computeNDVI(preEventImageMain);
var postNDVI = computeNDVI(postEventImageMain);

// Change Detection: Burn Severity and Vegetation Loss
var dNBR = preNBR.subtract(postNBR).rename('dNBR'); // Burn severity
var dNDVI = preNDVI.subtract(postNDVI).rename('dNDVI'); // Vegetation loss

// Visualization Parameters
var dNbrParams = {min: 0, max: 0.5, palette: ['yellow', 'orange', 'red']};
var dNdviParams = {min: -0.5, max: 0.5, palette: ['white', 'pink', 'purple']};
var trueColorParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
var falseColorUrbanParams = {
  bands: ['B12', 'B11', 'B4'],
  min: 0,
  max: 10000,
  gamma: 2.5
};

// Add Layers to Map
Map.addLayer(preEventImageMain, trueColorParams, 'Pre-event True Color');
Map.addLayer(postEventImageMain, trueColorParams, 'Post-event True Color');
Map.addLayer(dNBR, dNbrParams, 'Burn Severity (dNBR)');
Map.addLayer(dNDVI, dNdviParams, 'Vegetation Loss (dNDVI)');
Map.addLayer(preEventImageUrban, falseColorUrbanParams, 'Pre-event Urban Damage (False Color)');
Map.addLayer(postEventImageUrban, falseColorUrbanParams, 'Post-event Urban Damage (False Color)');
Map.addLayer(boundaryCoordsMain, {color: 'blue'}, 'Main Boundary');
Map.addLayer(boundaryCoordsUrban, {color: 'green'}, 'Urban Boundary');

// Export Pre-event True Color Imagery to Google Drive
Export.image.toDrive({
  image: preEventImageMain.clip(boundaryCoordsMain), // Clip to boundary
  description: 'LA_PreEvent_TrueColor',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsMain,
  maxPixels: 1e13
});

// Export Post-event True Color Imagery to Google Drive
Export.image.toDrive({
  image: postEventImageMain.clip(boundaryCoordsMain), // Clip to boundary
  description: 'LA_PostEvent_TrueColor',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsMain,
  maxPixels: 1e13
});

// Export Burn Severity (dNBR) to Google Drive
Export.image.toDrive({
  image: dNBR.clip(boundaryCoordsMain), // Clip to boundary
  description: 'LA_Burn_Severity_dNBR',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsMain,
  maxPixels: 1e13
});

// Export Vegetation Loss (dNDVI) to Google Drive
Export.image.toDrive({
  image: dNDVI.clip(boundaryCoordsMain), // Clip to boundary
  description: 'LA_Vegetation_Loss_dNDVI',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsMain,
  maxPixels: 1e13
});

// Export Pre-event Urban Damage (False Color) Imagery to Google Drive
Export.image.toDrive({
  image: preEventImageUrban.visualize(falseColorUrbanParams).clip(boundaryCoordsUrban),
  description: 'LA_PreEvent_UrbanDamage_FalseColor',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsUrban,
  maxPixels: 1e13
});

// Export Post-event Urban Damage (False Color) Imagery to Google Drive
Export.image.toDrive({
  image: postEventImageUrban.visualize(falseColorUrbanParams).clip(boundaryCoordsUrban),
  description: 'LA_PostEvent_UrbanDamage_FalseColor',
  folder: 'LA Wildfire',
  scale: 10, // 10 meters resolution
  region: boundaryCoordsUrban,
  maxPixels: 1e13
});

// Export Boundaries to Google Drive
Export.table.toDrive({
  collection: ee.FeatureCollection(boundaryCoordsMain),
  description: 'LA_MainBoundary',
  folder: 'LA Wildfire',
  fileFormat: 'KML'
});

Export.table.toDrive({
  collection: ee.FeatureCollection(boundaryCoordsUrban),
  description: 'LA_UrbanBoundary',
  folder: 'LA Wildfire',
  fileFormat: 'KML'
});

// Center the Map on the Main AOI
Map.centerObject(boundaryCoordsMain, 10);
