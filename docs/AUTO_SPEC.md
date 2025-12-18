# onshape-docureader

Generated: 2025-12-17 18:01

Using OnShape API to gather information about documents

## Scripts

- `build`: tsc && vite build
- `start`: node dist/index.js
- `dev`: concurrently "nodemon src/index.ts" "vite" "npm run open-bro...
- `open-browser`: sh -c 'sleep 3 && wslview http://localhost:5173'
- `clean`: rimraf dist
- `prebuild`: npm run clean && npm run spec
- `test`: echo "Error: no test specified" && exit 1
- `spec`: python project_tools/generate_spec.py . -o docs/AUTO_SPEC.md...

## Structure

```
onshape-docureader/
├── public/
│   ├── css/
│   │   ├── base/
│   │   │   ├── reset.css
│   │   │   ├── typography.css
│   │   │   └── variables.css
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── cards.css
│   │   │   ├── forms.css
│   │   │   ├── modals.css
│   │   │   ├── pagination.css
│   │   │   ├── tables.css
│   │   │   └── tabs.css
│   │   ├── layout/
│   │   │   ├── container.css
│   │   │   └── header.css
│   │   ├── views/
│   │   │   ├── airtable-upload.css
│   │   │   ├── document-detail.css
│   │   │   ├── documents.css
│   │   │   ├── element-detail.css
│   │   │   ├── export-filter-modal.css
│   │   │   ├── export.css
│   │   │   ├── landing.css
│   │   │   └── part-detail.css
│   │   └── main.css
│   ├── js/
│   │   ├── controllers/
│   │   │   ├── airtable-controller.js
│   │   │   ├── app-controller.js
│   │   │   ├── document-controller.js
│   │   │   └── export-controller.js
│   │   ├── router/
│   │   │   ├── Router.js
│   │   │   └── routes.js
│   │   ├── services/
│   │   │   ├── airtable-service.js
│   │   │   ├── api-client.js
│   │   │   ├── auth-service.js
│   │   │   ├── document-service.js
│   │   │   ├── export-service.js
│   │   │   └── thumbnail-service.js
│   │   ├── state/
│   │   │   ├── app-state.js
│   │   │   └── HistoryState.js
│   │   ├── utils/
│   │   │   ├── aggregateBomToCSV.js
│   │   │   ├── bomToCSV.js
│   │   │   ├── clipboard.js
│   │   │   ├── dom-helpers.js
│   │   │   ├── download.js
│   │   │   ├── file-download.js
│   │   │   ├── format-helpers.js
│   │   │   ├── fullAssemblyExporter.js
│   │   │   ├── getCSV.js
│   │   │   ├── getFilteredCSV.js
│   │   │   ├── massCSVExporter.js
│   │   │   └── toast-notification.js
│   │   ├── views/
│   │   │   ├── actions/
│   │   │   │   ├── document-actions.js
│   │   │   │   └── element-actions.js
│   │   │   ├── helpers/
│   │   │   │   ├── document-info-renderer.js
│   │   │   │   ├── element-list-renderer.js
│   │   │   │   └── pagination-renderer.js
│   │   │   ├── airtable-upload-view.js
│   │   │   ├── base-view.js
│   │   │   ├── document-detail-view.js
│   │   │   ├── document-list-view.js
│   │   │   ├── element-detail-view.js
│   │   │   ├── export-filter-modal.js
│   │   │   ├── export-progress-modal.js
│   │   │   ├── export-stats-modal.js
│   │   │   ├── full-extract-modal.js
│   │   │   ├── modal-manager.js
│   │   │   ├── navigation.js
│   │   │   ├── part-detail-view.js
│   │   │   └── workspace-view.js
│   │   └── app.js
│   ├── dashboard.html
│   └── index.html
├── src/
│   ├── config/
│   │   ├── airtable.ts
│   │   └── oauth.ts
│   ├── routes/
│   │   ├── airtable-api.ts
│   │   ├── airtable-auth.ts
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── services/
│   │   ├── airtable-api-client.ts
│   │   ├── airtable-oauth-service.ts
│   │   ├── airtable-thumbnail-service.ts
│   │   ├── api-call-cost.ts
│   │   ├── api-usage-tracker.ts
│   │   ├── oauth-service.ts
│   │   ├── onshape-api-client.ts
│   │   ├── session-storage.ts
│   │   └── usage-db.ts
│   ├── types/
│   │   ├── airtable.d.ts
│   │   ├── onshape.ts
│   │   ├── session.d.ts
│   │   └── usage.d.ts
│   └── index.ts
├── thumbnail_extraction/
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T15-44-46/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000308.png
│   │   │   ├── ASM-000309.png
│   │   │   ├── ASM-000310.png
│   │   │   ├── ASM-000319.png
│   │   │   ├── ASM-000320.png
│   │   │   ├── ASM-000369.png
│   │   │   ├── ASM-000372.png
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000392.png
│   │   │   ├── ASM-000524.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000565.png
│   │   │   ├── ASM-000573.png
│   │   │   ├── ASM-000585.png
│   │   │   ├── ASM-000613.png
│   │   │   ├── ASM-000655.png
│   │   │   ├── ASM-000683.png
│   │   │   ├── ASM-000832.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── ASM-001012.png
│   │   │   ├── ASM-001078.png
│   │   │   ├── ASM-001118.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000312.png
│   │   │   ├── PRT-000313.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000315.png
│   │   │   ├── PRT-000316.png
│   │   │   ├── PRT-000317.png
│   │   │   ├── PRT-000318.png
│   │   │   ├── PRT-000321.png
│   │   │   ├── PRT-000322.png
│   │   │   ├── PRT-000323.png
│   │   │   ├── PRT-000324.png
│   │   │   ├── PRT-000325.png
│   │   │   ├── PRT-000326.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000329.png
│   │   │   ├── PRT-000330.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000332.png
│   │   │   ├── PRT-000342.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000363.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000370.png
│   │   │   ├── PRT-000371.png
│   │   │   ├── PRT-000379.png
│   │   │   ├── PRT-000380.png
│   │   │   ├── PRT-000381.png
│   │   │   ├── PRT-000382.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000386.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000395.png
│   │   │   ├── PRT-000396.png
│   │   │   ├── PRT-000397.png
│   │   │   ├── PRT-000409.png
│   │   │   ├── PRT-000415.png
│   │   │   ├── PRT-000416.png
│   │   │   ├── PRT-000417.png
│   │   │   ├── PRT-000418.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000422.png
│   │   │   ├── PRT-000423.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000425.png
│   │   │   ├── PRT-000426.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000428.png
│   │   │   ├── PRT-000429.png
│   │   │   ├── PRT-000430.png
│   │   │   ├── PRT-000431.png
│   │   │   ├── PRT-000432.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000438.png
│   │   │   ├── PRT-000440.png
│   │   │   ├── PRT-000441.png
│   │   │   ├── PRT-000442.png
│   │   │   ├── PRT-000443.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000448.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000450.png
│   │   │   ├── PRT-000522.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000614.png
│   │   │   ├── PRT-000615.png
│   │   │   ├── PRT-000616.png
│   │   │   ├── PRT-000617.png
│   │   │   ├── PRT-000622.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000625.png
│   │   │   ├── PRT-000630.png
│   │   │   ├── PRT-000631.png
│   │   │   ├── PRT-000635.png
│   │   │   ├── PRT-000636.png
│   │   │   ├── PRT-000637.png
│   │   │   ├── PRT-000638.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000642.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000648.png
│   │   │   ├── PRT-000649.png
│   │   │   ├── PRT-000650.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000652.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000661.png
│   │   │   ├── PRT-000680.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000749.png
│   │   │   ├── PRT-000758.png
│   │   │   ├── PRT-000759.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000761.png
│   │   │   ├── PRT-000763.png
│   │   │   ├── PRT-000768.png
│   │   │   ├── PRT-000773.png
│   │   │   ├── PRT-000774.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000808.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000812.png
│   │   │   ├── PRT-000822.png
│   │   │   ├── PRT-000823.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000825.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000828.png
│   │   │   ├── PRT-000831.png
│   │   │   ├── PRT-000833.png
│   │   │   ├── PRT-000835.png
│   │   │   ├── PRT-000837.png
│   │   │   ├── PRT-000839.png
│   │   │   ├── PRT-000840.png
│   │   │   ├── PRT-000845.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000849.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000868.png
│   │   │   ├── PRT-000870.png
│   │   │   ├── PRT-000871.png
│   │   │   ├── PRT-000876.png
│   │   │   ├── PRT-000878.png
│   │   │   ├── PRT-000879.png
│   │   │   ├── PRT-000881.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000883.png
│   │   │   ├── PRT-000884.png
│   │   │   ├── PRT-000885.png
│   │   │   ├── PRT-000886.png
│   │   │   ├── PRT-000887.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000889.png
│   │   │   ├── PRT-000890.png
│   │   │   ├── PRT-000891.png
│   │   │   ├── PRT-000892.png
│   │   │   ├── PRT-000893.png
│   │   │   ├── PRT-000894.png
│   │   │   ├── PRT-000895.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000897.png
│   │   │   ├── PRT-000898.png
│   │   │   ├── PRT-000902.png
│   │   │   ├── PRT-000903.png
│   │   │   ├── PRT-000904.png
│   │   │   ├── PRT-000913.png
│   │   │   ├── PRT-000914.png
│   │   │   ├── PRT-000915.png
│   │   │   ├── PRT-000916.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000918.png
│   │   │   ├── PRT-000919.png
│   │   │   ├── PRT-000921.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000925.png
│   │   │   ├── PRT-000929.png
│   │   │   ├── PRT-000931.png
│   │   │   ├── PRT-000932.png
│   │   │   ├── PRT-000937.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000939.png
│   │   │   ├── PRT-000940.png
│   │   │   ├── PRT-000941.png
│   │   │   ├── PRT-000942.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000945.png
│   │   │   ├── PRT-000946.png
│   │   │   ├── PRT-000947.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000949.png
│   │   │   ├── PRT-000950.png
│   │   │   ├── PRT-000951.png
│   │   │   ├── PRT-000957.png
│   │   │   ├── PRT-000959.png
│   │   │   ├── PRT-000966.png
│   │   │   ├── PRT-000967.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000970.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000978.png
│   │   │   ├── PRT-000979.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-000988.png
│   │   │   ├── PRT-000990.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001002.png
│   │   │   ├── PRT-001007.png
│   │   │   ├── PRT-001013.png
│   │   │   ├── PRT-001014.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001016.png
│   │   │   ├── PRT-001017.png
│   │   │   ├── PRT-001018.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001047.png
│   │   │   ├── PRT-001048.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001051.png
│   │   │   ├── PRT-001052.png
│   │   │   ├── PRT-001053.png
│   │   │   ├── PRT-001054.png
│   │   │   ├── PRT-001055.png
│   │   │   ├── PRT-001056.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001060.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001069.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001071.png
│   │   │   ├── PRT-001072.png
│   │   │   ├── PRT-001073.png
│   │   │   ├── PRT-001074.png
│   │   │   ├── PRT-001075.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001079.png
│   │   │   ├── PRT-001080.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001082.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001093.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001097.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001100.png
│   │   │   ├── PRT-001103.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001105.png
│   │   │   ├── PRT-001107.png
│   │   │   ├── PRT-001108.png
│   │   │   ├── PRT-001109.png
│   │   │   ├── PRT-001111.png
│   │   │   ├── PRT-001112.png
│   │   │   ├── PRT-001113.png
│   │   │   ├── PRT-001114.png
│   │   │   ├── PRT-001115.png
│   │   │   ├── PRT-001116.png
│   │   │   └── PRT-001117.png
│   │   ├── thumbnails_ignored/
│   │   │   ├── Cable_Insertion-to-Wrist.png
│   │   │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│   │   │   ├── Ref_DistalGuide_Nut.png
│   │   │   ├── Ref_DistalGuide_Thumbscrew.png
│   │   │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T15-59-18/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000308.png
│   │   │   ├── ASM-000309.png
│   │   │   ├── ASM-000310.png
│   │   │   ├── ASM-000319.png
│   │   │   ├── ASM-000320.png
│   │   │   ├── ASM-000369.png
│   │   │   ├── ASM-000372.png
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000392.png
│   │   │   ├── ASM-000524.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000565.png
│   │   │   ├── ASM-000573.png
│   │   │   ├── ASM-000585.png
│   │   │   ├── ASM-000613.png
│   │   │   ├── ASM-000655.png
│   │   │   ├── ASM-000683.png
│   │   │   ├── ASM-000832.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── ASM-001012.png
│   │   │   ├── ASM-001078.png
│   │   │   ├── ASM-001118.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000312.png
│   │   │   ├── PRT-000313.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000315.png
│   │   │   ├── PRT-000316.png
│   │   │   ├── PRT-000317.png
│   │   │   ├── PRT-000318.png
│   │   │   ├── PRT-000321.png
│   │   │   ├── PRT-000322.png
│   │   │   ├── PRT-000323.png
│   │   │   ├── PRT-000324.png
│   │   │   ├── PRT-000325.png
│   │   │   ├── PRT-000326.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000329.png
│   │   │   ├── PRT-000330.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000332.png
│   │   │   ├── PRT-000342.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000363.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000370.png
│   │   │   ├── PRT-000371.png
│   │   │   ├── PRT-000379.png
│   │   │   ├── PRT-000380.png
│   │   │   ├── PRT-000381.png
│   │   │   ├── PRT-000382.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000386.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000395.png
│   │   │   ├── PRT-000396.png
│   │   │   ├── PRT-000397.png
│   │   │   ├── PRT-000409.png
│   │   │   ├── PRT-000415.png
│   │   │   ├── PRT-000416.png
│   │   │   ├── PRT-000417.png
│   │   │   ├── PRT-000418.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000422.png
│   │   │   ├── PRT-000423.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000425.png
│   │   │   ├── PRT-000426.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000428.png
│   │   │   ├── PRT-000429.png
│   │   │   ├── PRT-000430.png
│   │   │   ├── PRT-000431.png
│   │   │   ├── PRT-000432.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000438.png
│   │   │   ├── PRT-000440.png
│   │   │   ├── PRT-000441.png
│   │   │   ├── PRT-000442.png
│   │   │   ├── PRT-000443.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000448.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000450.png
│   │   │   ├── PRT-000522.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000614.png
│   │   │   ├── PRT-000615.png
│   │   │   ├── PRT-000616.png
│   │   │   ├── PRT-000617.png
│   │   │   ├── PRT-000622.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000625.png
│   │   │   ├── PRT-000630.png
│   │   │   ├── PRT-000631.png
│   │   │   ├── PRT-000635.png
│   │   │   ├── PRT-000636.png
│   │   │   ├── PRT-000637.png
│   │   │   ├── PRT-000638.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000642.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000648.png
│   │   │   ├── PRT-000649.png
│   │   │   ├── PRT-000650.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000652.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000661.png
│   │   │   ├── PRT-000680.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000749.png
│   │   │   ├── PRT-000758.png
│   │   │   ├── PRT-000759.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000761.png
│   │   │   ├── PRT-000763.png
│   │   │   ├── PRT-000768.png
│   │   │   ├── PRT-000773.png
│   │   │   ├── PRT-000774.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000808.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000812.png
│   │   │   ├── PRT-000822.png
│   │   │   ├── PRT-000823.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000825.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000828.png
│   │   │   ├── PRT-000831.png
│   │   │   ├── PRT-000833.png
│   │   │   ├── PRT-000835.png
│   │   │   ├── PRT-000837.png
│   │   │   ├── PRT-000839.png
│   │   │   ├── PRT-000840.png
│   │   │   ├── PRT-000845.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000849.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000868.png
│   │   │   ├── PRT-000870.png
│   │   │   ├── PRT-000871.png
│   │   │   ├── PRT-000876.png
│   │   │   ├── PRT-000878.png
│   │   │   ├── PRT-000879.png
│   │   │   ├── PRT-000881.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000883.png
│   │   │   ├── PRT-000884.png
│   │   │   ├── PRT-000885.png
│   │   │   ├── PRT-000886.png
│   │   │   ├── PRT-000887.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000889.png
│   │   │   ├── PRT-000890.png
│   │   │   ├── PRT-000891.png
│   │   │   ├── PRT-000892.png
│   │   │   ├── PRT-000893.png
│   │   │   ├── PRT-000894.png
│   │   │   ├── PRT-000895.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000897.png
│   │   │   ├── PRT-000898.png
│   │   │   ├── PRT-000902.png
│   │   │   ├── PRT-000903.png
│   │   │   ├── PRT-000904.png
│   │   │   ├── PRT-000913.png
│   │   │   ├── PRT-000914.png
│   │   │   ├── PRT-000915.png
│   │   │   ├── PRT-000916.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000918.png
│   │   │   ├── PRT-000919.png
│   │   │   ├── PRT-000921.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000925.png
│   │   │   ├── PRT-000929.png
│   │   │   ├── PRT-000931.png
│   │   │   ├── PRT-000932.png
│   │   │   ├── PRT-000937.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000939.png
│   │   │   ├── PRT-000940.png
│   │   │   ├── PRT-000941.png
│   │   │   ├── PRT-000942.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000945.png
│   │   │   ├── PRT-000946.png
│   │   │   ├── PRT-000947.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000949.png
│   │   │   ├── PRT-000950.png
│   │   │   ├── PRT-000951.png
│   │   │   ├── PRT-000957.png
│   │   │   ├── PRT-000959.png
│   │   │   ├── PRT-000966.png
│   │   │   ├── PRT-000967.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000970.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000978.png
│   │   │   ├── PRT-000979.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-000988.png
│   │   │   ├── PRT-000990.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001002.png
│   │   │   ├── PRT-001007.png
│   │   │   ├── PRT-001013.png
│   │   │   ├── PRT-001014.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001016.png
│   │   │   ├── PRT-001017.png
│   │   │   ├── PRT-001018.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001047.png
│   │   │   ├── PRT-001048.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001051.png
│   │   │   ├── PRT-001052.png
│   │   │   ├── PRT-001053.png
│   │   │   ├── PRT-001054.png
│   │   │   ├── PRT-001055.png
│   │   │   ├── PRT-001056.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001060.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001069.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001071.png
│   │   │   ├── PRT-001072.png
│   │   │   ├── PRT-001073.png
│   │   │   ├── PRT-001074.png
│   │   │   ├── PRT-001075.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001079.png
│   │   │   ├── PRT-001080.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001082.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001093.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001097.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001100.png
│   │   │   ├── PRT-001103.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001105.png
│   │   │   ├── PRT-001107.png
│   │   │   ├── PRT-001108.png
│   │   │   ├── PRT-001109.png
│   │   │   ├── PRT-001111.png
│   │   │   ├── PRT-001112.png
│   │   │   ├── PRT-001113.png
│   │   │   ├── PRT-001114.png
│   │   │   ├── PRT-001115.png
│   │   │   ├── PRT-001116.png
│   │   │   └── PRT-001117.png
│   │   ├── thumbnails_ignored/
│   │   │   ├── Cable_Insertion-to-Wrist.png
│   │   │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│   │   │   ├── Ref_DistalGuide_Nut.png
│   │   │   ├── Ref_DistalGuide_Thumbscrew.png
│   │   │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-05-16/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000308.png
│   │   │   ├── ASM-000309.png
│   │   │   ├── ASM-000310.png
│   │   │   ├── ASM-000319.png
│   │   │   ├── ASM-000320.png
│   │   │   ├── ASM-000369.png
│   │   │   ├── ASM-000372.png
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000392.png
│   │   │   ├── ASM-000524.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000565.png
│   │   │   ├── ASM-000573.png
│   │   │   ├── ASM-000585.png
│   │   │   ├── ASM-000613.png
│   │   │   ├── ASM-000655.png
│   │   │   ├── ASM-000683.png
│   │   │   ├── ASM-000832.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── ASM-001012.png
│   │   │   ├── ASM-001078.png
│   │   │   ├── ASM-001118.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000312.png
│   │   │   ├── PRT-000313.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000315.png
│   │   │   ├── PRT-000316.png
│   │   │   ├── PRT-000317.png
│   │   │   ├── PRT-000318.png
│   │   │   ├── PRT-000321.png
│   │   │   ├── PRT-000322.png
│   │   │   ├── PRT-000323.png
│   │   │   ├── PRT-000324.png
│   │   │   ├── PRT-000325.png
│   │   │   ├── PRT-000326.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000329.png
│   │   │   ├── PRT-000330.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000332.png
│   │   │   ├── PRT-000342.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000363.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000370.png
│   │   │   ├── PRT-000371.png
│   │   │   ├── PRT-000379.png
│   │   │   ├── PRT-000380.png
│   │   │   ├── PRT-000381.png
│   │   │   ├── PRT-000382.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000386.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000395.png
│   │   │   ├── PRT-000396.png
│   │   │   ├── PRT-000397.png
│   │   │   ├── PRT-000409.png
│   │   │   ├── PRT-000415.png
│   │   │   ├── PRT-000416.png
│   │   │   ├── PRT-000417.png
│   │   │   ├── PRT-000418.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000422.png
│   │   │   ├── PRT-000423.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000425.png
│   │   │   ├── PRT-000426.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000428.png
│   │   │   ├── PRT-000429.png
│   │   │   ├── PRT-000430.png
│   │   │   ├── PRT-000431.png
│   │   │   ├── PRT-000432.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000438.png
│   │   │   ├── PRT-000440.png
│   │   │   ├── PRT-000441.png
│   │   │   ├── PRT-000442.png
│   │   │   ├── PRT-000443.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000448.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000450.png
│   │   │   ├── PRT-000522.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000614.png
│   │   │   ├── PRT-000615.png
│   │   │   ├── PRT-000616.png
│   │   │   ├── PRT-000617.png
│   │   │   ├── PRT-000622.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000625.png
│   │   │   ├── PRT-000630.png
│   │   │   ├── PRT-000631.png
│   │   │   ├── PRT-000635.png
│   │   │   ├── PRT-000636.png
│   │   │   ├── PRT-000637.png
│   │   │   ├── PRT-000638.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000642.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000648.png
│   │   │   ├── PRT-000649.png
│   │   │   ├── PRT-000650.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000652.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000661.png
│   │   │   ├── PRT-000680.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000749.png
│   │   │   ├── PRT-000758.png
│   │   │   ├── PRT-000759.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000761.png
│   │   │   ├── PRT-000763.png
│   │   │   ├── PRT-000768.png
│   │   │   ├── PRT-000773.png
│   │   │   ├── PRT-000774.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000808.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000812.png
│   │   │   ├── PRT-000822.png
│   │   │   ├── PRT-000823.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000825.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000828.png
│   │   │   ├── PRT-000831.png
│   │   │   ├── PRT-000833.png
│   │   │   ├── PRT-000835.png
│   │   │   ├── PRT-000837.png
│   │   │   ├── PRT-000839.png
│   │   │   ├── PRT-000840.png
│   │   │   ├── PRT-000845.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000849.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000868.png
│   │   │   ├── PRT-000870.png
│   │   │   ├── PRT-000871.png
│   │   │   ├── PRT-000876.png
│   │   │   ├── PRT-000878.png
│   │   │   ├── PRT-000879.png
│   │   │   ├── PRT-000881.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000883.png
│   │   │   ├── PRT-000884.png
│   │   │   ├── PRT-000885.png
│   │   │   ├── PRT-000886.png
│   │   │   ├── PRT-000887.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000889.png
│   │   │   ├── PRT-000890.png
│   │   │   ├── PRT-000891.png
│   │   │   ├── PRT-000892.png
│   │   │   ├── PRT-000893.png
│   │   │   ├── PRT-000894.png
│   │   │   ├── PRT-000895.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000897.png
│   │   │   ├── PRT-000898.png
│   │   │   ├── PRT-000902.png
│   │   │   ├── PRT-000903.png
│   │   │   ├── PRT-000904.png
│   │   │   ├── PRT-000913.png
│   │   │   ├── PRT-000914.png
│   │   │   ├── PRT-000915.png
│   │   │   ├── PRT-000916.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000918.png
│   │   │   ├── PRT-000919.png
│   │   │   ├── PRT-000921.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000925.png
│   │   │   ├── PRT-000929.png
│   │   │   ├── PRT-000931.png
│   │   │   ├── PRT-000932.png
│   │   │   ├── PRT-000937.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000939.png
│   │   │   ├── PRT-000940.png
│   │   │   ├── PRT-000941.png
│   │   │   ├── PRT-000942.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000945.png
│   │   │   ├── PRT-000946.png
│   │   │   ├── PRT-000947.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000949.png
│   │   │   ├── PRT-000950.png
│   │   │   ├── PRT-000951.png
│   │   │   ├── PRT-000957.png
│   │   │   ├── PRT-000959.png
│   │   │   ├── PRT-000966.png
│   │   │   ├── PRT-000967.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000970.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000978.png
│   │   │   ├── PRT-000979.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-000988.png
│   │   │   ├── PRT-000990.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001002.png
│   │   │   ├── PRT-001007.png
│   │   │   ├── PRT-001013.png
│   │   │   ├── PRT-001014.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001016.png
│   │   │   ├── PRT-001017.png
│   │   │   ├── PRT-001018.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001047.png
│   │   │   ├── PRT-001048.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001051.png
│   │   │   ├── PRT-001052.png
│   │   │   ├── PRT-001053.png
│   │   │   ├── PRT-001054.png
│   │   │   ├── PRT-001055.png
│   │   │   ├── PRT-001056.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001060.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001069.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001071.png
│   │   │   ├── PRT-001072.png
│   │   │   ├── PRT-001073.png
│   │   │   ├── PRT-001074.png
│   │   │   ├── PRT-001075.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001079.png
│   │   │   ├── PRT-001080.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001082.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001093.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001097.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001100.png
│   │   │   ├── PRT-001103.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001105.png
│   │   │   ├── PRT-001107.png
│   │   │   ├── PRT-001108.png
│   │   │   ├── PRT-001109.png
│   │   │   ├── PRT-001111.png
│   │   │   ├── PRT-001112.png
│   │   │   ├── PRT-001113.png
│   │   │   ├── PRT-001114.png
│   │   │   ├── PRT-001115.png
│   │   │   ├── PRT-001116.png
│   │   │   └── PRT-001117.png
│   │   ├── thumbnails_ignored/
│   │   │   ├── Cable_Insertion-to-Wrist.png
│   │   │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│   │   │   ├── Ref_DistalGuide_Nut.png
│   │   │   ├── Ref_DistalGuide_Thumbscrew.png
│   │   │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-29-49/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000308.png
│   │   │   ├── ASM-000309.png
│   │   │   ├── ASM-000310.png
│   │   │   ├── ASM-000319.png
│   │   │   ├── ASM-000320.png
│   │   │   ├── ASM-000369.png
│   │   │   ├── ASM-000372.png
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000392.png
│   │   │   ├── ASM-000524.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000565.png
│   │   │   ├── ASM-000573.png
│   │   │   ├── ASM-000585.png
│   │   │   ├── ASM-000613.png
│   │   │   ├── ASM-000655.png
│   │   │   ├── ASM-000683.png
│   │   │   ├── ASM-000832.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── ASM-001012.png
│   │   │   ├── ASM-001078.png
│   │   │   ├── ASM-001118.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000312.png
│   │   │   ├── PRT-000313.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000315.png
│   │   │   ├── PRT-000316.png
│   │   │   ├── PRT-000317.png
│   │   │   ├── PRT-000318.png
│   │   │   ├── PRT-000321.png
│   │   │   ├── PRT-000322.png
│   │   │   ├── PRT-000323.png
│   │   │   ├── PRT-000324.png
│   │   │   ├── PRT-000325.png
│   │   │   ├── PRT-000326.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000329.png
│   │   │   ├── PRT-000330.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000332.png
│   │   │   ├── PRT-000342.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000363.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000370.png
│   │   │   ├── PRT-000371.png
│   │   │   ├── PRT-000379.png
│   │   │   ├── PRT-000380.png
│   │   │   ├── PRT-000381.png
│   │   │   ├── PRT-000382.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000386.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000395.png
│   │   │   ├── PRT-000396.png
│   │   │   ├── PRT-000397.png
│   │   │   ├── PRT-000409.png
│   │   │   ├── PRT-000415.png
│   │   │   ├── PRT-000416.png
│   │   │   ├── PRT-000417.png
│   │   │   ├── PRT-000418.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000422.png
│   │   │   ├── PRT-000423.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000425.png
│   │   │   ├── PRT-000426.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000428.png
│   │   │   ├── PRT-000429.png
│   │   │   ├── PRT-000430.png
│   │   │   ├── PRT-000431.png
│   │   │   ├── PRT-000432.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000438.png
│   │   │   ├── PRT-000440.png
│   │   │   ├── PRT-000441.png
│   │   │   ├── PRT-000442.png
│   │   │   ├── PRT-000443.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000448.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000450.png
│   │   │   ├── PRT-000522.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000614.png
│   │   │   ├── PRT-000615.png
│   │   │   ├── PRT-000616.png
│   │   │   ├── PRT-000617.png
│   │   │   ├── PRT-000622.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000625.png
│   │   │   ├── PRT-000630.png
│   │   │   ├── PRT-000631.png
│   │   │   ├── PRT-000635.png
│   │   │   ├── PRT-000636.png
│   │   │   ├── PRT-000637.png
│   │   │   ├── PRT-000638.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000642.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000648.png
│   │   │   ├── PRT-000649.png
│   │   │   ├── PRT-000650.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000652.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000661.png
│   │   │   ├── PRT-000680.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000749.png
│   │   │   ├── PRT-000758.png
│   │   │   ├── PRT-000759.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000761.png
│   │   │   ├── PRT-000763.png
│   │   │   ├── PRT-000768.png
│   │   │   ├── PRT-000773.png
│   │   │   ├── PRT-000774.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000808.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000812.png
│   │   │   ├── PRT-000822.png
│   │   │   ├── PRT-000823.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000825.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000828.png
│   │   │   ├── PRT-000831.png
│   │   │   ├── PRT-000833.png
│   │   │   ├── PRT-000835.png
│   │   │   ├── PRT-000837.png
│   │   │   ├── PRT-000839.png
│   │   │   ├── PRT-000840.png
│   │   │   ├── PRT-000845.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000849.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000868.png
│   │   │   ├── PRT-000870.png
│   │   │   ├── PRT-000871.png
│   │   │   ├── PRT-000876.png
│   │   │   ├── PRT-000878.png
│   │   │   ├── PRT-000879.png
│   │   │   ├── PRT-000881.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000883.png
│   │   │   ├── PRT-000884.png
│   │   │   ├── PRT-000885.png
│   │   │   ├── PRT-000886.png
│   │   │   ├── PRT-000887.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000889.png
│   │   │   ├── PRT-000890.png
│   │   │   ├── PRT-000891.png
│   │   │   ├── PRT-000892.png
│   │   │   ├── PRT-000893.png
│   │   │   ├── PRT-000894.png
│   │   │   ├── PRT-000895.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000897.png
│   │   │   ├── PRT-000898.png
│   │   │   ├── PRT-000902.png
│   │   │   ├── PRT-000903.png
│   │   │   ├── PRT-000904.png
│   │   │   ├── PRT-000913.png
│   │   │   ├── PRT-000914.png
│   │   │   ├── PRT-000915.png
│   │   │   ├── PRT-000916.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000918.png
│   │   │   ├── PRT-000919.png
│   │   │   ├── PRT-000921.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000925.png
│   │   │   ├── PRT-000929.png
│   │   │   ├── PRT-000931.png
│   │   │   ├── PRT-000932.png
│   │   │   ├── PRT-000937.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000939.png
│   │   │   ├── PRT-000940.png
│   │   │   ├── PRT-000941.png
│   │   │   ├── PRT-000942.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000945.png
│   │   │   ├── PRT-000946.png
│   │   │   ├── PRT-000947.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000949.png
│   │   │   ├── PRT-000950.png
│   │   │   ├── PRT-000951.png
│   │   │   ├── PRT-000957.png
│   │   │   ├── PRT-000959.png
│   │   │   ├── PRT-000966.png
│   │   │   ├── PRT-000967.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000970.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000978.png
│   │   │   ├── PRT-000979.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-000988.png
│   │   │   ├── PRT-000990.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001002.png
│   │   │   ├── PRT-001007.png
│   │   │   ├── PRT-001013.png
│   │   │   ├── PRT-001014.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001016.png
│   │   │   ├── PRT-001017.png
│   │   │   ├── PRT-001018.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001047.png
│   │   │   ├── PRT-001048.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001051.png
│   │   │   ├── PRT-001052.png
│   │   │   ├── PRT-001053.png
│   │   │   ├── PRT-001054.png
│   │   │   ├── PRT-001055.png
│   │   │   ├── PRT-001056.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001060.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001069.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001071.png
│   │   │   ├── PRT-001072.png
│   │   │   ├── PRT-001073.png
│   │   │   ├── PRT-001074.png
│   │   │   ├── PRT-001075.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001079.png
│   │   │   ├── PRT-001080.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001082.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001093.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001097.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001100.png
│   │   │   ├── PRT-001103.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001105.png
│   │   │   ├── PRT-001107.png
│   │   │   ├── PRT-001108.png
│   │   │   ├── PRT-001109.png
│   │   │   ├── PRT-001111.png
│   │   │   ├── PRT-001112.png
│   │   │   ├── PRT-001113.png
│   │   │   ├── PRT-001114.png
│   │   │   ├── PRT-001115.png
│   │   │   ├── PRT-001116.png
│   │   │   └── PRT-001117.png
│   │   ├── thumbnails_ignored/
│   │   │   ├── Cable_Insertion-to-Wrist.png
│   │   │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│   │   │   ├── Ref_DistalGuide_Nut.png
│   │   │   ├── Ref_DistalGuide_Thumbscrew.png
│   │   │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-45-07/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-46-22/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-47-28/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   └── PRT-000846.png
│   │   └── bom_data.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-48-12/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-49-27/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-53-44/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-55-03/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-56-30/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T16-58-06/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T17-03-36/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T17-06-26/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── PRT-000311.png
│   │   │   ├── PRT-000314.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001113.png
│   │   │   └── PRT-001115.png
│   │   ├── thumbnails_ignored/
│   │   │   └── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   ├── D01-LazaSystems_BOM_Estimate_2025-12-17-T17-10-03/
│   │   ├── thumbnails/
│   │   │   ├── ASM-000308.png
│   │   │   ├── ASM-000309.png
│   │   │   ├── ASM-000310.png
│   │   │   ├── ASM-000319.png
│   │   │   ├── ASM-000320.png
│   │   │   ├── ASM-000369.png
│   │   │   ├── ASM-000372.png
│   │   │   ├── ASM-000375.png
│   │   │   ├── ASM-000392.png
│   │   │   ├── ASM-000524.png
│   │   │   ├── ASM-000542.png
│   │   │   ├── ASM-000565.png
│   │   │   ├── ASM-000573.png
│   │   │   ├── ASM-000585.png
│   │   │   ├── ASM-000613.png
│   │   │   ├── ASM-000655.png
│   │   │   ├── ASM-000683.png
│   │   │   ├── ASM-000832.png
│   │   │   ├── ASM-000844.png
│   │   │   ├── ASM-000961.png
│   │   │   ├── ASM-001012.png
│   │   │   ├── ASM-001078.png
│   │   │   ├── ASM-001118.png
│   │   │   ├── PRT-000312.png
│   │   │   ├── PRT-000313.png
│   │   │   ├── PRT-000315.png
│   │   │   ├── PRT-000316.png
│   │   │   ├── PRT-000317.png
│   │   │   ├── PRT-000318.png
│   │   │   ├── PRT-000321.png
│   │   │   ├── PRT-000322.png
│   │   │   ├── PRT-000323.png
│   │   │   ├── PRT-000324.png
│   │   │   ├── PRT-000325.png
│   │   │   ├── PRT-000326.png
│   │   │   ├── PRT-000328.png
│   │   │   ├── PRT-000329.png
│   │   │   ├── PRT-000330.png
│   │   │   ├── PRT-000331.png
│   │   │   ├── PRT-000332.png
│   │   │   ├── PRT-000342.png
│   │   │   ├── PRT-000357.png
│   │   │   ├── PRT-000361.png
│   │   │   ├── PRT-000363.png
│   │   │   ├── PRT-000364.png
│   │   │   ├── PRT-000370.png
│   │   │   ├── PRT-000371.png
│   │   │   ├── PRT-000379.png
│   │   │   ├── PRT-000380.png
│   │   │   ├── PRT-000381.png
│   │   │   ├── PRT-000382.png
│   │   │   ├── PRT-000383.png
│   │   │   ├── PRT-000384.png
│   │   │   ├── PRT-000385.png
│   │   │   ├── PRT-000386.png
│   │   │   ├── PRT-000394.png
│   │   │   ├── PRT-000395.png
│   │   │   ├── PRT-000396.png
│   │   │   ├── PRT-000397.png
│   │   │   ├── PRT-000409.png
│   │   │   ├── PRT-000415.png
│   │   │   ├── PRT-000416.png
│   │   │   ├── PRT-000417.png
│   │   │   ├── PRT-000418.png
│   │   │   ├── PRT-000420.png
│   │   │   ├── PRT-000421.png
│   │   │   ├── PRT-000422.png
│   │   │   ├── PRT-000423.png
│   │   │   ├── PRT-000424.png
│   │   │   ├── PRT-000425.png
│   │   │   ├── PRT-000426.png
│   │   │   ├── PRT-000427.png
│   │   │   ├── PRT-000428.png
│   │   │   ├── PRT-000429.png
│   │   │   ├── PRT-000430.png
│   │   │   ├── PRT-000431.png
│   │   │   ├── PRT-000432.png
│   │   │   ├── PRT-000433.png
│   │   │   ├── PRT-000434.png
│   │   │   ├── PRT-000437.png
│   │   │   ├── PRT-000438.png
│   │   │   ├── PRT-000440.png
│   │   │   ├── PRT-000441.png
│   │   │   ├── PRT-000442.png
│   │   │   ├── PRT-000443.png
│   │   │   ├── PRT-000444.png
│   │   │   ├── PRT-000448.png
│   │   │   ├── PRT-000449.png
│   │   │   ├── PRT-000450.png
│   │   │   ├── PRT-000522.png
│   │   │   ├── PRT-000523.png
│   │   │   ├── PRT-000569.png
│   │   │   ├── PRT-000614.png
│   │   │   ├── PRT-000615.png
│   │   │   ├── PRT-000616.png
│   │   │   ├── PRT-000617.png
│   │   │   ├── PRT-000622.png
│   │   │   ├── PRT-000623.png
│   │   │   ├── PRT-000625.png
│   │   │   ├── PRT-000630.png
│   │   │   ├── PRT-000631.png
│   │   │   ├── PRT-000635.png
│   │   │   ├── PRT-000636.png
│   │   │   ├── PRT-000637.png
│   │   │   ├── PRT-000638.png
│   │   │   ├── PRT-000639.png
│   │   │   ├── PRT-000642.png
│   │   │   ├── PRT-000643.png
│   │   │   ├── PRT-000647.png
│   │   │   ├── PRT-000648.png
│   │   │   ├── PRT-000649.png
│   │   │   ├── PRT-000650.png
│   │   │   ├── PRT-000651.png
│   │   │   ├── PRT-000652.png
│   │   │   ├── PRT-000660.png
│   │   │   ├── PRT-000661.png
│   │   │   ├── PRT-000680.png
│   │   │   ├── PRT-000692.png
│   │   │   ├── PRT-000698.png
│   │   │   ├── PRT-000700.png
│   │   │   ├── PRT-000749.png
│   │   │   ├── PRT-000758.png
│   │   │   ├── PRT-000759.png
│   │   │   ├── PRT-000760.png
│   │   │   ├── PRT-000761.png
│   │   │   ├── PRT-000763.png
│   │   │   ├── PRT-000768.png
│   │   │   ├── PRT-000773.png
│   │   │   ├── PRT-000774.png
│   │   │   ├── PRT-000775.png
│   │   │   ├── PRT-000786.png
│   │   │   ├── PRT-000808.png
│   │   │   ├── PRT-000811.png
│   │   │   ├── PRT-000822.png
│   │   │   ├── PRT-000823.png
│   │   │   ├── PRT-000824.png
│   │   │   ├── PRT-000825.png
│   │   │   ├── PRT-000826.png
│   │   │   ├── PRT-000827.png
│   │   │   ├── PRT-000828.png
│   │   │   ├── PRT-000831.png
│   │   │   ├── PRT-000833.png
│   │   │   ├── PRT-000835.png
│   │   │   ├── PRT-000837.png
│   │   │   ├── PRT-000839.png
│   │   │   ├── PRT-000840.png
│   │   │   ├── PRT-000845.png
│   │   │   ├── PRT-000846.png
│   │   │   ├── PRT-000849.png
│   │   │   ├── PRT-000851.png
│   │   │   ├── PRT-000856.png
│   │   │   ├── PRT-000864.png
│   │   │   ├── PRT-000868.png
│   │   │   ├── PRT-000870.png
│   │   │   ├── PRT-000871.png
│   │   │   ├── PRT-000876.png
│   │   │   ├── PRT-000878.png
│   │   │   ├── PRT-000879.png
│   │   │   ├── PRT-000882.png
│   │   │   ├── PRT-000888.png
│   │   │   ├── PRT-000892.png
│   │   │   ├── PRT-000893.png
│   │   │   ├── PRT-000894.png
│   │   │   ├── PRT-000895.png
│   │   │   ├── PRT-000896.png
│   │   │   ├── PRT-000898.png
│   │   │   ├── PRT-000902.png
│   │   │   ├── PRT-000903.png
│   │   │   ├── PRT-000904.png
│   │   │   ├── PRT-000917.png
│   │   │   ├── PRT-000924.png
│   │   │   ├── PRT-000925.png
│   │   │   ├── PRT-000929.png
│   │   │   ├── PRT-000931.png
│   │   │   ├── PRT-000932.png
│   │   │   ├── PRT-000938.png
│   │   │   ├── PRT-000942.png
│   │   │   ├── PRT-000943.png
│   │   │   ├── PRT-000948.png
│   │   │   ├── PRT-000957.png
│   │   │   ├── PRT-000959.png
│   │   │   ├── PRT-000966.png
│   │   │   ├── PRT-000967.png
│   │   │   ├── PRT-000969.png
│   │   │   ├── PRT-000970.png
│   │   │   ├── PRT-000973.png
│   │   │   ├── PRT-000978.png
│   │   │   ├── PRT-000979.png
│   │   │   ├── PRT-000986.png
│   │   │   ├── PRT-000988.png
│   │   │   ├── PRT-000990.png
│   │   │   ├── PRT-001001.png
│   │   │   ├── PRT-001002.png
│   │   │   ├── PRT-001007.png
│   │   │   ├── PRT-001013.png
│   │   │   ├── PRT-001014.png
│   │   │   ├── PRT-001015.png
│   │   │   ├── PRT-001016.png
│   │   │   ├── PRT-001017.png
│   │   │   ├── PRT-001018.png
│   │   │   ├── PRT-001019.png
│   │   │   ├── PRT-001049.png
│   │   │   ├── PRT-001053.png
│   │   │   ├── PRT-001055.png
│   │   │   ├── PRT-001056.png
│   │   │   ├── PRT-001057.png
│   │   │   ├── PRT-001058.png
│   │   │   ├── PRT-001061.png
│   │   │   ├── PRT-001062.png
│   │   │   ├── PRT-001063.png
│   │   │   ├── PRT-001066.png
│   │   │   ├── PRT-001067.png
│   │   │   ├── PRT-001068.png
│   │   │   ├── PRT-001069.png
│   │   │   ├── PRT-001070.png
│   │   │   ├── PRT-001072.png
│   │   │   ├── PRT-001073.png
│   │   │   ├── PRT-001076.png
│   │   │   ├── PRT-001079.png
│   │   │   ├── PRT-001080.png
│   │   │   ├── PRT-001081.png
│   │   │   ├── PRT-001082.png
│   │   │   ├── PRT-001083.png
│   │   │   ├── PRT-001092.png
│   │   │   ├── PRT-001094.png
│   │   │   ├── PRT-001095.png
│   │   │   ├── PRT-001096.png
│   │   │   ├── PRT-001099.png
│   │   │   ├── PRT-001100.png
│   │   │   ├── PRT-001103.png
│   │   │   ├── PRT-001104.png
│   │   │   ├── PRT-001105.png
│   │   │   ├── PRT-001107.png
│   │   │   ├── PRT-001108.png
│   │   │   ├── PRT-001109.png
│   │   │   ├── PRT-001111.png
│   │   │   ├── PRT-001112.png
│   │   │   ├── PRT-001113.png
│   │   │   ├── PRT-001114.png
│   │   │   ├── PRT-001115.png
│   │   │   ├── PRT-001116.png
│   │   │   └── PRT-001117.png
│   │   ├── thumbnails_ignored/
│   │   │   ├── Cable_Insertion-to-Wrist.png
│   │   │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│   │   │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│   │   │   ├── Ref_DistalGuide_Nut.png
│   │   │   ├── Ref_DistalGuide_Thumbscrew.png
│   │   │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│   │   ├── bom_data.csv
│   │   ├── bom_data.json
│   │   └── thumbnail_report.json
│   └── D01-LazaSystems_BOM_Estimate_2025-12-17-T17-14-10/
│       ├── thumbnails/
│       │   ├── ASM-000308.png
│       │   ├── ASM-000309.png
│       │   ├── ASM-000310.png
│       │   ├── ASM-000319.png
│       │   ├── ASM-000320.png
│       │   ├── ASM-000369.png
│       │   ├── ASM-000372.png
│       │   ├── ASM-000375.png
│       │   ├── ASM-000392.png
│       │   ├── ASM-000524.png
│       │   ├── ASM-000542.png
│       │   ├── ASM-000565.png
│       │   ├── ASM-000573.png
│       │   ├── ASM-000585.png
│       │   ├── ASM-000613.png
│       │   ├── ASM-000655.png
│       │   ├── ASM-000683.png
│       │   ├── ASM-000832.png
│       │   ├── ASM-000844.png
│       │   ├── ASM-000961.png
│       │   ├── ASM-001012.png
│       │   ├── ASM-001078.png
│       │   ├── ASM-001118.png
│       │   ├── PRT-000311.png
│       │   ├── PRT-000312.png
│       │   ├── PRT-000313.png
│       │   ├── PRT-000314.png
│       │   ├── PRT-000315.png
│       │   ├── PRT-000316.png
│       │   ├── PRT-000317.png
│       │   ├── PRT-000318.png
│       │   ├── PRT-000321.png
│       │   ├── PRT-000322.png
│       │   ├── PRT-000323.png
│       │   ├── PRT-000324.png
│       │   ├── PRT-000325.png
│       │   ├── PRT-000326.png
│       │   ├── PRT-000328.png
│       │   ├── PRT-000329.png
│       │   ├── PRT-000330.png
│       │   ├── PRT-000331.png
│       │   ├── PRT-000332.png
│       │   ├── PRT-000342.png
│       │   ├── PRT-000357.png
│       │   ├── PRT-000361.png
│       │   ├── PRT-000363.png
│       │   ├── PRT-000364.png
│       │   ├── PRT-000370.png
│       │   ├── PRT-000371.png
│       │   ├── PRT-000379.png
│       │   ├── PRT-000380.png
│       │   ├── PRT-000381.png
│       │   ├── PRT-000382.png
│       │   ├── PRT-000383.png
│       │   ├── PRT-000384.png
│       │   ├── PRT-000385.png
│       │   ├── PRT-000386.png
│       │   ├── PRT-000394.png
│       │   ├── PRT-000395.png
│       │   ├── PRT-000396.png
│       │   ├── PRT-000397.png
│       │   ├── PRT-000409.png
│       │   ├── PRT-000415.png
│       │   ├── PRT-000416.png
│       │   ├── PRT-000417.png
│       │   ├── PRT-000418.png
│       │   ├── PRT-000420.png
│       │   ├── PRT-000421.png
│       │   ├── PRT-000422.png
│       │   ├── PRT-000423.png
│       │   ├── PRT-000424.png
│       │   ├── PRT-000425.png
│       │   ├── PRT-000426.png
│       │   ├── PRT-000427.png
│       │   ├── PRT-000428.png
│       │   ├── PRT-000429.png
│       │   ├── PRT-000430.png
│       │   ├── PRT-000431.png
│       │   ├── PRT-000432.png
│       │   ├── PRT-000433.png
│       │   ├── PRT-000434.png
│       │   ├── PRT-000437.png
│       │   ├── PRT-000438.png
│       │   ├── PRT-000440.png
│       │   ├── PRT-000441.png
│       │   ├── PRT-000442.png
│       │   ├── PRT-000443.png
│       │   ├── PRT-000444.png
│       │   ├── PRT-000448.png
│       │   ├── PRT-000449.png
│       │   ├── PRT-000450.png
│       │   ├── PRT-000522.png
│       │   ├── PRT-000523.png
│       │   ├── PRT-000569.png
│       │   ├── PRT-000614.png
│       │   ├── PRT-000615.png
│       │   ├── PRT-000616.png
│       │   ├── PRT-000617.png
│       │   ├── PRT-000622.png
│       │   ├── PRT-000623.png
│       │   ├── PRT-000625.png
│       │   ├── PRT-000630.png
│       │   ├── PRT-000631.png
│       │   ├── PRT-000635.png
│       │   ├── PRT-000636.png
│       │   ├── PRT-000637.png
│       │   ├── PRT-000638.png
│       │   ├── PRT-000639.png
│       │   ├── PRT-000642.png
│       │   ├── PRT-000643.png
│       │   ├── PRT-000647.png
│       │   ├── PRT-000648.png
│       │   ├── PRT-000649.png
│       │   ├── PRT-000650.png
│       │   ├── PRT-000651.png
│       │   ├── PRT-000652.png
│       │   ├── PRT-000660.png
│       │   ├── PRT-000661.png
│       │   ├── PRT-000680.png
│       │   ├── PRT-000692.png
│       │   ├── PRT-000698.png
│       │   ├── PRT-000700.png
│       │   ├── PRT-000749.png
│       │   ├── PRT-000758.png
│       │   ├── PRT-000759.png
│       │   ├── PRT-000760.png
│       │   ├── PRT-000761.png
│       │   ├── PRT-000763.png
│       │   ├── PRT-000768.png
│       │   ├── PRT-000773.png
│       │   ├── PRT-000774.png
│       │   ├── PRT-000775.png
│       │   ├── PRT-000786.png
│       │   ├── PRT-000808.png
│       │   ├── PRT-000822.png
│       │   ├── PRT-000823.png
│       │   ├── PRT-000824.png
│       │   ├── PRT-000825.png
│       │   ├── PRT-000826.png
│       │   ├── PRT-000827.png
│       │   ├── PRT-000828.png
│       │   ├── PRT-000831.png
│       │   ├── PRT-000833.png
│       │   ├── PRT-000835.png
│       │   ├── PRT-000837.png
│       │   ├── PRT-000839.png
│       │   ├── PRT-000840.png
│       │   ├── PRT-000845.png
│       │   ├── PRT-000846.png
│       │   ├── PRT-000849.png
│       │   ├── PRT-000851.png
│       │   ├── PRT-000856.png
│       │   ├── PRT-000868.png
│       │   ├── PRT-000870.png
│       │   ├── PRT-000871.png
│       │   ├── PRT-000876.png
│       │   ├── PRT-000878.png
│       │   ├── PRT-000879.png
│       │   ├── PRT-000888.png
│       │   ├── PRT-000892.png
│       │   ├── PRT-000893.png
│       │   ├── PRT-000894.png
│       │   ├── PRT-000895.png
│       │   ├── PRT-000896.png
│       │   ├── PRT-000898.png
│       │   ├── PRT-000902.png
│       │   ├── PRT-000903.png
│       │   ├── PRT-000904.png
│       │   ├── PRT-000925.png
│       │   ├── PRT-000929.png
│       │   ├── PRT-000931.png
│       │   ├── PRT-000932.png
│       │   ├── PRT-000942.png
│       │   ├── PRT-000943.png
│       │   ├── PRT-000957.png
│       │   ├── PRT-000959.png
│       │   ├── PRT-000966.png
│       │   ├── PRT-000967.png
│       │   ├── PRT-000969.png
│       │   ├── PRT-000970.png
│       │   ├── PRT-000973.png
│       │   ├── PRT-000978.png
│       │   ├── PRT-000979.png
│       │   ├── PRT-000986.png
│       │   ├── PRT-000988.png
│       │   ├── PRT-000990.png
│       │   ├── PRT-001001.png
│       │   ├── PRT-001002.png
│       │   ├── PRT-001007.png
│       │   ├── PRT-001013.png
│       │   ├── PRT-001014.png
│       │   ├── PRT-001015.png
│       │   ├── PRT-001016.png
│       │   ├── PRT-001017.png
│       │   ├── PRT-001018.png
│       │   ├── PRT-001019.png
│       │   ├── PRT-001053.png
│       │   ├── PRT-001055.png
│       │   ├── PRT-001056.png
│       │   ├── PRT-001062.png
│       │   ├── PRT-001066.png
│       │   ├── PRT-001067.png
│       │   ├── PRT-001069.png
│       │   ├── PRT-001072.png
│       │   ├── PRT-001073.png
│       │   ├── PRT-001079.png
│       │   ├── PRT-001080.png
│       │   ├── PRT-001082.png
│       │   ├── PRT-001083.png
│       │   ├── PRT-001092.png
│       │   ├── PRT-001095.png
│       │   ├── PRT-001096.png
│       │   ├── PRT-001099.png
│       │   ├── PRT-001100.png
│       │   ├── PRT-001103.png
│       │   ├── PRT-001104.png
│       │   ├── PRT-001105.png
│       │   ├── PRT-001107.png
│       │   ├── PRT-001108.png
│       │   ├── PRT-001109.png
│       │   ├── PRT-001111.png
│       │   ├── PRT-001112.png
│       │   ├── PRT-001113.png
│       │   ├── PRT-001114.png
│       │   ├── PRT-001115.png
│       │   ├── PRT-001116.png
│       │   └── PRT-001117.png
│       ├── thumbnails_ignored/
│       │   ├── Cable_Insertion-to-Wrist.png
│       │   ├── Pin_Dowel_DIA3_L22_SS_ISO2338-m6_McM_91585A372.png
│       │   ├── Pin_Dowel_DIA3_L24_SS_ISO2338-m6_McM_91585A402.png
│       │   ├── Ref_DistalGuide_Nut.png
│       │   ├── Ref_DistalGuide_Thumbscrew.png
│       │   └── Screw_M6x1_HEX_L30_SS_McM_91287A139.png
│       ├── bom_data.csv
│       ├── bom_data.json
│       └── thumbnail_report.json
├── LICENSE
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── test.csv
├── tsconfig.json
└── vite.config.js
```

## Stats

Files: 60 | Lines: 14,633 | Routes: 45 | TODOs: 6

## Routes

- USE /auth
- USE /auth/airtable
- USE /api
- USE /api/airtable
- GET /
- GET /dashboard
- GET /config
- GET /bases
- GET /bases/:baseId/tables
- GET /bases/:baseId/tables/:tableId/schema
- GET /bases/:baseId/tables/:tableId/records
- POST /upload-thumbnails
- POST /find-record
- GET /login
- GET /callback
- GET /status
- POST /logout
- POST /refresh
- GET /user
- GET /documents
- GET /documents/:id
- GET /documents/:id/versions
- GET /documents/:id/branches
- GET /documents/:id/combined-history
- GET /documents/:id/history
- GET /documents/:id/comprehensive
- GET /documents/:id/parent
- GET /documents/:id/workspaces/:wid/elements
- GET /documents/:id/versions/:vid/elements
- GET /documents/:id/workspaces/:wid/elements/:eid/parts
- GET /documents/:id/workspaces/:wid/elements/:eid/assemblies
- GET /documents/:id/workspaces/:wid/elements/:eid/bom
- GET /documents/:id/workspaces/:wid/elements/:eid/metadata
- GET /documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties
- GET /onshape/folders
- GET /onshape/folders/:id
- GET /export/all
- GET /export/stream
- GET /export/directory-stats
- POST /export/prepare-assemblies
- GET /export/aggregate-bom-stream
- GET /export/aggregate-bom
- GET /thumbnail-metadata
- GET /thumbnail-proxy
- GET /usage/stats

## TODOs

- [bomToCSV.js] TODO: Check for edge cases, e.g. commas, quotes in values
- [airtable-upload-view.js] TODO: Implement actual cancellation if using streaming upload
- [document-detail-view.js] NOTE: We fetch elements via the version endpoint
- [pagination-renderer.js] NOTE: OnShape's /documents endpoint doesn't include folder names directly
- [airtable.ts] NOTE: Attachment uploads require data.records:write scope
- [api-call-cost.ts] NOTE: These are estimates and may not reflect actual costs incurred by Onshape

## Modules

### Configs

#### src/config/airtable.ts

Airtable OAuth & API Configuration Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs.

**interface AirtableConfig** {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authorizationUrl: string
  tokenUrl: string
  apiBaseUrl: string
  contentBaseUrl: string
  baseId: string
  tableId: string
}

Functions:
- `isAirtableConfigured() -> boolean`
- `isAirtableDatabaseConfigured() -> boolean`

Imports: dotenv

#### src/config/oauth.ts

**interface OAuthConfig** {
  clientId: string
  clientSecret: string
  redirectUri: string
  baseApiUrl: string
  oauthBaseUrl: string
  scope: string
}

Functions:
- `validateConfig() -> void`

Imports: dotenv

### Routes

#### src/routes/airtable-api.ts

Airtable API Routes Proxy routes for Airtable API operations. Requires Airtable authentication (separate from OnShape auth).

Routes: GET /config, GET /bases, GET /bases/:baseId/tables, GET /bases/:baseId/tables/:tableId/schema, GET /bases/:baseId/tables/:tableId/records

Imports: express

#### src/routes/airtable-auth.ts

Airtable Authentication Routes Handles OAuth 2.0 flow for Airtable authentication. Separate from OnShape auth to allow independent login/logout.

Routes: GET /login, GET /callback, GET /status, POST /logout, POST /refresh

Imports: express

#### src/routes/api.ts

Routes: GET /user, GET /documents, GET /documents/:id, GET /documents/:id/versions, GET /documents/:id/branches

Imports: express

#### src/routes/auth.ts

Routes: GET /login, GET /callback, GET /status, POST /logout

Imports: express

### Controllers

#### public/js/controllers/airtable-controller.js

AirtableController - handles Airtable authentication and thumbnail upload workflows

**class AirtableController**
  constructor(state, services, navigation)
  Methods:
    - _bindDashboardEvents()
    - _escapeHandler(e)
    - async _handleAirtableButtonClick()
    - async showUploadPage(restoredState = null)
    - async show(restoredState = null)
    - _navigateBack()
    - login()
    - async logout()

#### public/js/controllers/app-controller.js

**class AppController**
  constructor(state, services, navigation, controllers)
  Methods:
    - async init()
    - bindGlobalEvents()
    - updateAuthUI(state)

#### public/js/controllers/document-controller.js

DocumentController - orchestrates document flows

**class DocumentController**
  constructor(
    state,
    services,
    navigation,
    thumbnailService,
    router,
    historyState
  )
  Methods:
    - _bindDashboardEvents()
    - async refreshDashboard()
    - navigateToDocument(documentId)
    - async showDocument(documentId, restoredState)
    - async showList(restoredState)
    - async _initializeWorkspace(restoredState)
    - async loadWorkspaceRoot()
    - async loadFolder(folderId, updateBreadcrumbs = true, folderName = null)

#### public/js/controllers/export-controller.js

ExportController - orchestrates export workflow

**class ExportController**
  constructor(state, services, modalManager)
  Methods:
    - showExportModal(selectedDocuments = null)
    - async startExport(options)
    - cancelExport()

### Services

#### public/js/services/airtable-service.js

AirtableService - handles Airtable API interactions from frontend

**class AirtableService**
  Methods:
    - async getAuthStatus()
    - async getConfiguration()
    - login(returnTo = '/#/airtable/upload')
    - async logout()
    - async getBases()
    - async getTables(baseId)
    - async getTableSchema(baseId, tableId)
    - async uploadThumbnails(zipFile, config = {}, onProgress = null)

#### public/js/services/api-client.js

**class ApiClient**
  Methods:
    - async getAuthStatus()
    - async logout()
    - async getUser()
    - async getDocuments(limit = 50, offset = 0)
    - async getDocument(documentId)
    - async getDocumentVersions(documentId)
    - async getDocumentBranches(documentId)
    - async getCombinedDocumentHistory(documentId)

#### public/js/services/auth-service.js

**class AuthService**
  constructor(api)
  Methods:
    - async checkStatus()
    - login()
    - async logout()
    - async getUser()

#### public/js/services/document-service.js

DocumentService - document-related operations

**class DocumentService**
  constructor(api)
  Methods:
    - async getAll(limit = 50, offset = 0)
    - async getById(documentId)
    - async getVersions(documentId)
    - async getBranches(documentId)
    - async getCombinedHistory(documentId)
    - async getElements(documentId, workspaceId)
    - async getParts(documentId, workspaceId, elementId)
    - async getAssemblies(documentId, workspaceId, elementId)

#### public/js/services/export-service.js

ExportService - executes export workflows

**class ExportService**
  constructor(api)
  Methods:
    - async execute(options)
    - stream(options, handlers)

#### public/js/services/thumbnail-service.js

ThumbnailService - image handling and fallbacks

**class ThumbnailService**
  Methods:
    - setup(docId, originalUrl, proxyUrl)

#### src/services/airtable-api-client.ts

Airtable API Client Provides methods for interacting with Airtable's REST API. Handles record operations, schema retrieval, and attachment uploads.

**class AirtableApiClient**
  constructor(accessToken: string)
  Properties: axiosInstance: AxiosInstance, accessToken: string
  Methods:
    - async listBases() -> Promise<AirtableBasesResponse>
    - async listTables(baseId: string) -> Promise<
    - async getTables(baseId: string) -> Promise<
    - async listRecords(baseId: string, tableId: string, options?: {
      filterByFormula?: string;
      fields?: string[];
      maxRecords?: number;
      pageSize?: number;
      offset?: string;
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    }) -> Promise<AirtableListResponse>
    - async getRecord(baseId: string, tableId: string, recordId: string) -> Promise<AirtableRecord>
    - async updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, unknown>) -> Promise<AirtableRecord>
    - async getTableSchema(baseId: string, tableId: string) -> Promise<TableSchema>
    - async getFieldId(baseId: string, tableId: string, fieldName: string) -> Promise<string | null>

Imports: axios

#### src/services/airtable-oauth-service.ts

Airtable OAuth 2.0 Service Handles OAuth 2.0 Authorization Code flow with PKCE for Airtable. Similar pattern to OnShape OAuth service but adapted for Airtable's OAuth implementation.

**class AirtableOAuthService**
  Properties: clientId: string, clientSecret: string, redirectUri: string, scopes: string[], authorizationUrl: string, tokenUrl: string
  Methods:
    - generateRandomString(length: number = 32) -> string
    - generateCodeVerifier() -> string
    - generateCodeChallenge(verifier: string) -> string
    - generateAuthUrl(state: string, codeChallenge: string) -> string
    - async exchangeCodeForTokens(code: string, codeVerifier: string) -> Promise<AirtableTokenResponse>
    - async refreshAccessToken(refreshToken: string) -> Promise<AirtableTokenResponse>
    - isTokenExpired(expiresAt: number) -> boolean

Imports: axios, crypto

#### src/services/airtable-thumbnail-service.ts

Airtable Thumbnail Upload Service Handles processing ZIP files containing thumbnails and uploading them to matching Airtable records based on part number.

**class AirtableThumbnailService**
  constructor(apiClient: AirtableApiClient, config?: Partial<ThumbnailServiceConfig>)
  Properties: apiClient: AirtableApiClient, config: ThumbnailServiceConfig
  Methods:
    - parseFilename(filename: string) -> ParsedFilename | null
    - async findRecordByPartNumber(partNumber: string) -> Promise<AirtableRecord | null>
    - async uploadThumbnail(recordId: string, imageBuffer: Buffer, filename: string) -> Promise<void>

Imports: jszip, p-limit

#### src/services/api-call-cost.ts

Functions:
- `estimateCost(endpoint: string) -> number`

#### src/services/api-usage-tracker.ts

**class ApiUsageTracker**
  constructor(logFile = ".data/api-usage.jsonl")
  Properties: logFile: string, dataDir: string
  Methods:
    - async log(entry: UsageEntry) -> Promise<void>
    - async getStats(hours: number = 24) -> Promise<UsageStats>
    - async getEndpointBreakdown() -> Promise<EndpointStats[]>
    - async estimateCosts(costMap: Record<string, number> = {}) -> Promise<CostEstimate>

Imports: fs/promises, path

#### src/services/oauth-service.ts

**class OAuthService**
  Properties: instance: OAuthService

Imports: axios, uuid

#### src/services/onshape-api-client.ts

**class OnShapeApiClient**
  constructor(
    accessToken: string,
    userId?: string,
    tracker?: ApiUsageTracker
  )
  Properties: axiosInstance: AxiosInstance, accessToken: string, usageTracker?: ApiUsageTracker, userId?: string, baseApiRoot: string
  Methods:
    - async getCurrentUser() -> Promise<OnShapeUser>
    - async getDocuments(limit: number = 50, offset: number = 0) -> Promise<
    - async getDocument(documentId: string) -> Promise<OnShapeDocumentInfo>
    - async getDocumentVersions(documentId: string) -> Promise<any[]>
    - async getDocumentBranches(documentId: string) -> Promise<any[]>
    - async getDocumentHistory(documentId: string) -> Promise<any[]>
    - async getCombinedDocumentHistory(documentId: string) -> Promise<
    - async getComprehensiveDocument(documentId: string, params: any) -> Promise<any>

Imports: axios, p-limit, events

#### src/services/session-storage.ts

**class SessionStorage extends Store**
  Properties: instance: SessionStorage, sessionsFilePath: string, sessions: Record<string, any>

Imports: fs, path, express-session

#### src/services/usage-db.ts

**class UsageDatabase**
  constructor(dbPath = ".data/api-usage.db")
  Properties: db: Database.Database
  Methods:
    - logRequest(entry: UsageEntry)
    - getStats(hours = 24)

Imports: better-sqlite3

### States

#### public/js/state/app-state.js

**class AppState**
  Methods:
    - subscribe(listener)
    - getState()
    - setState(patch)
    - replaceState(newState)
    - toggleDocumentSelection(documentId)
    - toggleFolderSelection(folderId)
    - clearExportSelection()
    - getExportSelectionCount()

### Views

#### public/js/views/actions/document-actions.js

Action handlers for document-level operations

**class DocumentActions**
  constructor(controller)
  Methods:
    - async handleGetDocument(docId)
    - async handleGetJson(docData)
    - async handleCopyJson(docData)
    - async handleLoadHierarchy(docId, controller)
    - async handleExportCsv(docData, elements)

#### public/js/views/actions/element-actions.js

Action handlers for element-level operations

**class ElementActions**
  constructor(controller, documentService)
  Methods:
    - async handleCopyElementJson(element, controller)
    - async handleFetchBomJson(element, documentId, workspaceId, service)
    - async handleDownloadBomCsv(element, documentId, workspaceId, service)
    - async handleFullExtract(element, documentId, workspaceId, service)

#### public/js/views/airtable-upload-view.js

AirtableUploadView - UI for uploading thumbnails to Airtable

**class AirtableUploadView extends BaseView**
  constructor(containerSelector, controller, airtableService)
  Methods:
    - async render(isAuthenticated)
    - _renderUnauthenticated()
    - async _renderAuthenticated()
    - _bindLoginButton()
    - _bindEvents()
    - _bindDropzone()
    - _handleFileSelect(file)
    - _clearFile()

#### public/js/views/base-view.js

BaseView - abstract base with common helpers

**class BaseView**
  constructor(containerSelector)
  Methods:
    - ensureContainer()
    - clear()
    - renderHtml(html)
    - bind()
    - unbind()

#### public/js/views/document-detail-view.js

DocumentDetailView - slim orchestration layer

**class DocumentDetailView extends BaseView**
  constructor(containerSelector, controller, thumbnailService)
  Methods:
    - render(docData, elements)
    - _renderTopBar(docData)
    - _renderHistorySelector(docData)
    - _bindHistorySelector(docData)
    - async _handleLoadHistory(documentId)
    - _renderHistoryDropdown(history, documentId)
    - _bindHistoryDropdown(documentId)
    - _displayHistoryDetails(documentId, item)

#### public/js/views/document-list-view.js

DocumentListView - renders document grid/table

**class DocumentListView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - render(documents, pagination = null)
    - bind()
    - _bindPaginationControls()
    - _notifySelectionChanged()
    - _delegate(selector, eventName, handler)
    - unbind()
    - captureState()
    - restoreState(state)

#### public/js/views/element-detail-view.js

**class ElementDetailView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - render(element)
    - _bindBackButton()
    - captureState()
    - restoreState(state)

#### public/js/views/export-filter-modal.js

Modal for configuring export filters before pre-scan. Allows filtering by folder prefix to limit scope of export.

**class ExportFilterModal**
  Methods:
    - prompt()
    - _show()
    - hide()
    - _handleKeyDown(e)
    - _renderContent()
    - _handleConfirm()
    - _handleCancel()

#### public/js/views/export-progress-modal.js

Modal view for displaying real-time export progress. Connects to SSE endpoint and shows progress bar, ETA, status.

**class ExportProgressModal**
  Methods:
    - show({ stats, workers = 4, delay = 100, onComplete, onCancel, onError, startExport })
    - renderInitialContent(stats)
    - handleProgress(event)
    - logProgress(event)
    - updatePhase(phase, fetch)
    - updateProgressBar(percent)
    - updateCount(type, value)
    - updateCurrentItem(text)

#### public/js/views/export-stats-modal.js

Modal view for displaying pre-scan export statistics. Shows before starting full aggregate BOM export. Enhanced with live stats, root folder visualization, and cancel/resume capability.

**class ExportStatsModal**
  Methods:
    - show(stats, { onConfirm, onCancel, isPartial = false, selectionCount = 0, prefixFilter = null })
    - hide()
    - clearCheckpointOnSuccess()
    - _handleKeyDown(e)
    - renderModalContent(stats, { isPartial = false, selectionCount = 0, prefixFilter = null } = {})
    - handleConfirm()
    - handleCancel()
    - showLoading()

#### public/js/views/full-extract-modal.js

Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages.

Functions:
- `showModal(assemblyName)`
- `hideModal()`
- `isModalVisible()`
- `updateProgress(progress)`

#### public/js/views/helpers/document-info-renderer.js

Pure rendering functions for document metadata sections

Functions:
- `renderDocumentInfo(docData)`
- `renderThumbnailSection(docData)`
- `renderTagsAndLabels(docData)`

#### public/js/views/helpers/element-list-renderer.js

Pure rendering for elements list

Functions:
- `renderElementsList(elements)`
- `renderElementItem(element)`
- `renderElementActions(element)`

#### public/js/views/helpers/pagination-renderer.js

Pure rendering functions for pagination controls

Functions:
- `renderPaginationControls(pagination) -> string`
- `renderDocumentRows(documents) -> string`

#### public/js/views/modal-manager.js

ModalManager - controls export and progress modals

**class ModalManager**
  Methods:
    - setHandlers(handlers)
    - showExport()
    - hideExport()
    - showProgress()
    - hideProgress()
    - bindExportModalEvents()
    - bindProgressModalEvents()
    - readExportOptions()

#### public/js/views/navigation.js

Navigation - page transitions

**class Navigation**
  Methods:
    - navigateTo(pageId)
    - getCurrentPage()

#### public/js/views/part-detail-view.js

PartDetailView - renders part details and mass properties

**class PartDetailView**
  Methods:
    - render(part)
    - _bindBackButton()
    - captureState()
    - restoreState(state)

#### public/js/views/workspace-view.js

Insert zero-width space BEFORE natural word separators to allow line breaks This prevents breaks in the middle of words like "PCBAs" becoming "PCB" + "As" The break opportunity is placed BEFORE the...

**class WorkspaceView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - bind()
    - showLoading()
    - hideLoading()
    - showError(msg)
    - hideError()
    - render(items, breadcrumbs, workspaceName = null)
    - _updateWorkspaceName(name)
    - _renderBreadcrumbs(path)

### Utils

#### public/js/utils/aggregateBomToCSV.js

Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging.

Functions:
- `aggregateBomToCSV(aggregateResult, options) -> string`

#### public/js/utils/bomToCSV.js

Convert Onshape BOM JSON to CSV.

Functions:
- `bomToCSV(bomJson)`

#### public/js/utils/clipboard.js

Clipboard utilities

Functions:
- `async copyToClipboard(text)`

#### public/js/utils/dom-helpers.js

DOM helpers and safe HTML utilities

Functions:
- `qs(selector, root)`
- `qsa(selector, root)`
- `on(el, event, handler, options)`
- `delegate(root, selector, eventName, handler)`
- `escapeHtml(text)`

#### public/js/utils/download.js

Download helpers

Functions:
- `downloadJson(data, filenamePrefix)`

#### public/js/utils/file-download.js

Generic file download utilities

Functions:
- `downloadJson(data, filename)`
- `downloadCsv(csvString, filename)`
- `createDownloadLink(blob, filename)`

#### public/js/utils/format-helpers.js

Formatting helpers (pure functions)

Functions:
- `formatDateWithUser(dateStr, userObj)`

#### public/js/utils/fullAssemblyExporter.js

Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item (organized by part number prefix)

Functions:
- `sanitizeForFilename(str, maxLength) -> string`
- `buildThumbnailFilename(rowData) -> string`
- `buildThumbnailUrl(info, size) -> string|null`
- `parseBomRow(row, headerMap, legacyHeaderMap, index) -> Object`
- `async fullAssemblyExtract(options)`

Imports: jszip

#### public/js/utils/getCSV.js

Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX,...

Functions:
- `getCSV(parts) -> string`

#### public/js/utils/massCSVExporter.js

Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2.

Functions:
- `async exportAllDocumentsAsZip(apiClient, documentService)`
- `async exportAllDocuments(apiClient, documentService)`

Imports: jszip

#### public/js/utils/toast-notification.js

Centralized toast notification system

Functions:
- `showToast(message, duration)`

### Types

#### src/types/airtable.d.ts

Airtable Type Definitions Type definitions for Airtable session data and API structures.

**interface AirtableSessionData** {
  accessToken: string
  refreshToken: string
  tokenExpiry: number
  scope: string
}

**interface AirtableOAuthState** {
  codeVerifier: string
  state: string
}

#### src/types/onshape.ts

OnShape API Types Shared type definitions for OnShape API responses and internal data structures

**type OnShapeElementType**

**interface OnShapeUser** {
  id: string
  name: string
  email: string
  firstName?: string
  lastName?: string
}

**interface AssemblyReference** {
  documentId: string
  documentName: string
  workspaceId: string
  elementId: string
  elementName: string
  folderPath: string[]
}

**interface AssemblyBomFetchResult** {
  source: {...}
  assembly: {...}
  bom: {...}
  error?: string
  fetchDurationMs?: number
}

**interface DirectoryStats** {
  scanDate: string
  scanDurationMs: number
  summary: {...}
  elementTypes: {...}
  estimates: {...}
  assemblies: AssemblyReference[]
}

#### src/types/usage.d.ts

**interface UsageEntry** {
  timestamp: string
  endpoint: string
  method: string
  userId?: string
  responseTime: number
  status: number
  cached?: boolean
}

**interface UsageStats** {
  timeWindow: string
  summary: {...}
  byEndpoint: EndpointStats[]
  byUser: UserStats[]
  responseTimePercentiles: {...}
}

**interface EndpointStats** {
  endpoint: string
  count: number
  avgResponseTime: number
  errorRate: number
}

**interface UserStats** {
  userId: string
  count: number
  avgResponseTime: number
}

**interface CostEstimate** {
  totalEstimatedCost: number
  costByEndpoint: Array<{...}>
}

### Modules

#### public/js/router/routes.js

Route definitions and configuration. Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers

Functions:
- `configureRoutes(router, controllers)`
- `pathTo(pattern, params, query) -> string`

#### src/index.ts [entry]

Routes: USE /auth, USE /auth/airtable, USE /api, USE /api/airtable, GET /

Imports: express, cors, helmet, morgan, cookie-parser, express-session, path, url

## Dependencies

axios, better-sqlite3, cookie-parser, cors, crypto-js, dotenv, express, express-session, helmet, jszip, morgan, p-limit, uuid
