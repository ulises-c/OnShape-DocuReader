Partial work currently.

https://github.com/Airtable/airtable.js

https://github.com/Airtable/airtable.js/blob/master/build/airtable.browser.js

# Update/Upsert Records

Update Parts ordered records

To update Parts ordered records, use the update or replace method. An update will only update the fields you include. Fields not included will be unchanged. A replace will perform a destructive update and clear all unincluded cell values. A replace call on Parts ordered records will always fail. The example at the right uses the non-destructive update method. Click here to show a destructive replace call.

The first argument should be an array of up to 10 record objects. Each of these objects should have an id property representing the record ID and a fields property which contains all of your record's cell values by field name or field id for all of your record's cell values by field name.

To add attachments to Thumbnail/ Image and Quote/Files, add new attachment objects to the existing array. Be sure to include all existing attachment objects that you wish to retain, to keep preexisting attachments providing id is required (which can be retrieved using the retrieve endpoint), other fields are ignored. For the new attachments being added, url is required, and filename is optional. To remove attachments, include the existing array of attachment objects, excluding any that you wish to remove.

Note that in most cases the API does not currently return an error code for failed attachment object creation given attachment uploading happens in an asynchronous manner, such cases will manifest with the attachment object either being cleared from the cell or persisted with generated URLs that return error responses when queried. If the same attachment URL fails to upload multiple times in a short time interval then _ the API may return an ATTACHMENTS_FAILED_UPLOADING error code in the details field of the response and the attachment object will _ be cleared from the cell synchronously.

We also require URLs used to upload have the https:// or http:// protocol (Note: http:// support will be removed in the near future), have a limit of 3 max redirects, and a file size limit of 1GB. In addition, URLs must be publicly accessible, in cases where cookie authentication or logging in to access the file is required, the login page HTML will be downloaded instead of the file.

If too many attachments are uploaded within a short period of time, the server may return a partial failure on record creation with an "Attachment Upload Rate Too High" error.

To link to new records in Supplier, Requestor and Used in Prototypes, add new linked record IDs to the existing array. Be sure to include all existing linked record IDs that you wish to retain. To unlink records, include the existing array of record IDs, excluding any that you wish to unlink.

To select new options in Category and Purpose, add new option names to the existing array. Be sure to include all existing option names that you wish to retain. To deselect options, include the existing array of option names, excluding any that you wish to deselect.

Values for Parts/Items, Total Cost, Qty Pending, Autonumber, Last Modified, Last Modified By and Last Modified Day are automatically computed by Airtable and cannot be directly updated. You cannot clear these, even with a replace call.

Automatic data conversion for update actions can be enabled via typecast parameter. See create record for details.

You can also include a single record object at the top level. Click here to show an example.

```js
// Code

var Airtable = require("airtable");
var base = new Airtable({ apiKey: "REDACTED_API_KEY" }).base(
  "appXXXXXXXXXXXXXX"
);

base("Parts ordered").update(
  [
    {
      id: "recXXXXXXXX",
      fields: {
        Description:
          '15.6" Slim Medical Display\n15.6" Full HD 1920 x 1080 (16:9) LCD, 400nits, Contrast\nRatio: 800:1, Projected Capacitive Multi-touch, HDMI 1.4\nx1, VGA x1...',
        Status: "Ordered",
        Supplier: ["recZZZZZZZZ"],
        "LeadTime[weeks]": "6.0",
        Requestor: ["recYYYYYYYY"],
        "Date Ordered": "2025-10-28",
        Qty: 1,
        "Unit Cost": 800,
        "Purchase Order": "PO-REDACTED",
        "Supplier PN": "MEDDP-615HPN-A1-1020",
        ETA: "2025-12-17",
      },
    },
    {
      id: "recXXXXXXXX",
      fields: {
        Description: '10.1" All-in-One Monitor',
        Status: "Received",
        Supplier: ["recAAAAAAAA"],
        "LeadTime[weeks]": "10.0",
        Requestor: ["recYYYYYYYY"],
        "Date Ordered": "2025-10-01",
        Qty: 1,
        "Unit Cost": 550,
        "Purchase Order": "PO-REDACTED",
        "Supplier PN": "PC10xxxR",
      },
    },
    {
      id: "recXXXXXXXX",
      fields: {
        Description: "ECXFL32L KL A HTQ 24V",
        Status: "Ordered",
        Supplier: ["recBBBBBBBB"],
        "LeadTime[weeks]": "???",
        Requestor: ["recCCCCCCCC"],
        "Date Ordered": "2025-09-24",
        Qty: 4,
        "Unit Cost": 440,
        "Purchase Order": "PO-REDACTED",
        "Supplier PN": "B82E586EBBF1",
        Category: ["Motor"],
      },
    },
  ],
  function (err, records) {
    if (err) {
      console.error(err);
      return;
    }
    records.forEach(function (record) {
      console.log(record.get("Parts/Items"));
    });
  }
);

// Output
```

# Fields - Thumbnail/Image

Field Name: Thumbnail/ Image
Field ID: fldXXXXXXXX
Type: Attachment
Description: array of attachment objects
Each attachment object may contain the following properties. To see which fields are required or optional, please consult the relevant section: retrieve, create, update, or delete.

---

id: string
unique attachment id

---

url: string
url, e.g. "https://example.com/files/REDACTED".

## Note: URLs returned will expire 2 hours after being returned from our API. If you want to persist the attachments, we recommend downloading them instead of saving the URL. See our support article for more information.

filename: string
filename, e.g. "foo.jpg"

---

size: number
file size, in bytes

---

type: string
content type, e.g. "image/jpeg"

---

width: number
height: number
width/height, in pixels (these may be available if the attachment is an image)

---

thumbnails.small.url: string
thumbnails.large.url: string
url of small/large thumbnails (these may be available if the attachment is an image or document). See notes under `url` about the lifetime of these URLs.

---

thumbnails.small.width: number
thumbnails.small.height: number
thumbnails.large.width: number
thumbnails.large.height: number
width/height of small/large thumbnails, in pixels (these will be available if the corresponding thumbnail url is available)

---

```js
// Example value

[
  {
    id: "attXXXXXXXXXXXX",
    size: 26317,
    url: "https://example.com/files/123456",
    type: "image/jpeg",
    filename: "12345_1_xl.jpg",
    thumbnails: {
      small: {
        url: "https://example.com/files/123456-small",
        width: 54,
        height: 36,
      },
      large: {
        url: "https://example.com/files/123456-large",
        width: 197,
        height: 131,
      },
    },
  },
];
```
