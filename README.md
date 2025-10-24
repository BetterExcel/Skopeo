# Skopeo

This is the main repository for the Skopeo project

# 1. Setup

Since we have a submodule added in the project, you must clone the repo by

```
git clone --recurse-submodules https://github.com/BetterExcel/Skopeo.git
```

Make sure you have the following installed
- docker
- docker-compose

```bash
# From the project root
./scripts/setup.sh
docker-compose up -d
```

# 2. Opening Collabora

To open the collabora calc sheet, open your browser and search for the url `http://localhost:9980/browser/d4c13af737/debug.html?file_path=%2Fapp%2Fsrc%2Fview%2Ftest%2Fsamples%2Fcalc-edit.fods`. This should open the collabora spreadsheet with the latest code changes (considering you did build the docker compose).

If you wish to compile your new changes, run `docker-compose up -d --build --force-recreate` from root directory.

# 3. Information

Main UI changes are located in `src/view/browser/control/Control.NotebookCalc.js` and `src/view/browser/control/Control.NotebookWriter.js`

Happy Coding :)
