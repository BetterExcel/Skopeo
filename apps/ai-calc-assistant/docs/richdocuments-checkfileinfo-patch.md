# Richdocuments WOPI CheckFileInfo Patch (Task 6.1)

To enable secure cross-frame messaging between the AI Calc Assistant sidebar and Collabora Online, extend the Richdocuments WOPI CheckFileInfo response for Calc documents.

## Goal

- Set `EnableRemoteAIContent: true` for Calc docs
- Set `PostMessageOrigin` to the Nextcloud web origin (e.g., `https://cloud.example.com`)

## Example patch (illustrative)

Locate the method that assembles CheckFileInfo in the Richdocuments app (commonly `apps/richdocuments/lib/Controller/WopiController.php::checkFileInfo`). After the base response is populated and you’ve determined it’s a Calc document, add:

```php
// Enable AI features for Calc documents
$response['EnableRemoteAIContent'] = true;

// Derive origin from config or request
$origin = $this->config->getAppValue('richdocuments', 'post_message_origin', '');
if ($origin === '') {
    // Fallback: compute from request (ensure trusted proxies/overwriteprotocol are configured)
    $scheme = $request->getServerProtocol(); // https or http
    $host = $request->getServerHost(); // cloud.example.com
    $origin = $scheme . '://' . $host;
}
$response['PostMessageOrigin'] = $origin;
```

Guard so it only applies to Calc mimetypes, e.g. `application/vnd.oasis.opendocument.spreadsheet` and other spreadsheet types handled by Collabora.

## Configuration

- Prefer setting a dedicated admin config key to avoid ambiguity:
  - App: `richdocuments`
  - Key: `post_message_origin`
  - Value: your public Nextcloud origin (e.g., `https://cloud.example.com`)
- Ensure Nextcloud behind reverse proxies has `overwrite.cli.url`, `overwriteprotocol`, and `trusted_proxies` set correctly so computed origins match the browser-visible origin.

## Validation

1. Open a Calc file in Nextcloud.
2. In DevTools → Network, inspect the WOPI `CheckFileInfo` response. Verify:
   - `EnableRemoteAIContent: true`
   - `PostMessageOrigin` equals the page origin.
3. Ensure no cross-origin errors appear in the console when the sidebar loads.

## Troubleshooting

- If `PostMessageOrigin` mismatches, you’ll see a warning in the sidebar’s Configuration checks box and postMessage calls can be blocked.
- When running multiple domains, choose one canonical origin (or extend Richdocuments to store a list and pick at runtime).
