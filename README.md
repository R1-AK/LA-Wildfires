# LA Santa Ana Winds Devastation Mapping

This repository contains a script to analyze and map the devastation caused by Santa Ana winds in Los Angeles using Sentinel-2 imagery. The analysis focuses on burn severity and vegetation loss, along with urban damage mapping, for the event dated January 10, 2025.

## Features
- **Boundary Definitions**: Two areas of interest (AOIs) defined for analysis:
  - **Main Boundary**: Covers a large area to analyze vegetation loss and burn severity.
  - **Urban Boundary**: Focused on urban damage mapping using false color composites.
- **Sentinel-2 Surface Reflectance Imagery**:
  - Filters imagery based on date, location, and cloud cover (less than 20%).
  - Produces median composites to reduce noise.
- **Indices Computation**:
  - **Normalized Burn Ratio (NBR)**: Highlights burn severity.
  - **Normalized Difference Vegetation Index (NDVI)**: Highlights vegetation health and loss.
- **Visualizations**:
  - True color imagery for pre-event and post-event analysis.
  - False color composites for urban damage detection.
  - Change detection layers for burn severity (dNBR) and vegetation loss (dNDVI).
- **Exports**:
  - Imagery (true color, false color, dNBR, and dNDVI) clipped to boundaries and exported to Google Drive.
  - Boundary geometries exported as KML files.

## Script Workflow
1. **Define Boundaries**:
   ```javascript
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
   ```

2. **Set Analysis Period**:
   ```javascript
   var eventDate = ee.Date('2025-01-10'); // Event Date: January 10, 2025
   var preEventStart = eventDate.advance(-10, 'day'); // 10 days before
   var preEventEnd = eventDate.advance(-1, 'day');    // 1 day before
   var postEventStart = eventDate;                   // Event Date
   var postEventEnd = eventDate.advance(10, 'day');  // 10 days after
   ```

3. **Load Sentinel-2 Imagery**:
   ```javascript
   function loadSentinelImages(startDate, endDate, boundary) {
     return ee.ImageCollection('COPERNICUS/S2_SR')
       .filterDate(startDate, endDate)
       .filterBounds(boundary)
       .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Cloud cover less than 20%
       .median(); // Composite to reduce noise
   }
   ```

4. **Compute Indices**:
   ```javascript
   function computeNBR(image) {
     return image.normalizedDifference(['B8', 'B12']).rename('NBR'); // Near-IR and SWIR
   }

   function computeNDVI(image) {
     return image.normalizedDifference(['B8', 'B4']).rename('NDVI'); // Near-IR and Red
   }
   ```

5. **Visualize Results**:
   ```javascript
   var dNbrParams = {min: 0, max: 0.5, palette: ['yellow', 'orange', 'red']};
   var dNdviParams = {min: -0.5, max: 0.5, palette: ['white', 'pink', 'purple']};
   var trueColorParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
   var falseColorUrbanParams = {
     bands: ['B12', 'B11', 'B4'],
     min: 0,
     max: 10000,
     gamma: 2.5
   };

   Map.addLayer(preEventImageMain, trueColorParams, 'Pre-event True Color');
   Map.addLayer(postEventImageMain, trueColorParams, 'Post-event True Color');
   Map.addLayer(dNBR, dNbrParams, 'Burn Severity (dNBR)');
   Map.addLayer(dNDVI, dNdviParams, 'Vegetation Loss (dNDVI)');
   Map.addLayer(preEventImageUrban, falseColorUrbanParams, 'Pre-event Urban Damage (False Color)');
   Map.addLayer(postEventImageUrban, falseColorUrbanParams, 'Post-event Urban Damage (False Color)');
   ```

6. **Export Data**:
   ```javascript
   Export.image.toDrive({
     image: preEventImageMain.clip(boundaryCoordsMain),
     description: 'LA_PreEvent_TrueColor',
     folder: 'LA Wildfire',
     scale: 10,
     region: boundaryCoordsMain,
     maxPixels: 1e13
   });

   Export.image.toDrive({
     image: postEventImageMain.clip(boundaryCoordsMain),
     description: 'LA_PostEvent_TrueColor',
     folder: 'LA Wildfire',
     scale: 10,
     region: boundaryCoordsMain,
     maxPixels: 1e13
   });
   ```

## Visualization Parameters
- **True Color**:
  - Bands: `B4`, `B3`, `B2` (Red, Green, Blue)
  - Range: 0–3000
- **False Color (Urban)**:
  - Bands: `B12`, `B11`, `B4` (SWIR, SWIR, Red)
  - Range: 0–10000
  - Gamma: 2.5
- **Change Detection**:
  - dNBR: Yellow to Red (`['yellow', 'orange', 'red']`)
  - dNDVI: White to Purple (`['white', 'pink', 'purple']`)

## Outputs
- **Main AOI**:
  - Pre-event true color imagery (`LA_PreEvent_TrueColor`)
  - Post-event true color imagery (`LA_PostEvent_TrueColor`)
  - Burn severity (`LA_Burn_Severity_dNBR`)
  - Vegetation loss (`LA_Vegetation_Loss_dNDVI`)
- **Urban AOI**:
  - Pre-event urban damage false color imagery (`LA_PreEvent_UrbanDamage_FalseColor`)
  - Post-event urban damage false color imagery (`LA_PostEvent_UrbanDamage_FalseColor`)
- **Boundaries**:
  - Main Boundary KML (`LA_MainBoundary`)
  - Urban Boundary KML (`LA_UrbanBoundary`)

## Dependencies
- Google Earth Engine account.
- Google Drive for exporting data.

## Notes
- Ensure adequate cloud-free imagery is available for the analysis period.
- Adjust the zoom level (`Map.centerObject`) and parameters as needed for your specific requirements.


