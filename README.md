# Skopeo

This is the main repository for the Skopeo project

# 1. Setup 

Since we have a submodule added in the project, you must clone the repo by

```
git clone --recurse-submodules ...
```

Make sure you have the following installed 
- docker
- docker-compose

```bash
# From the project root
./scripts/setup.sh
docker-compose up -d
```

Before mentioning the next steps, I'll mention the app architecture fort better understanding of what's to come next
- The application uses Collabora online code in `view/` folder. This serves as the backend when processing a spreadsheet. For the purposes of this project, this will be called a `view`. The Collabora docker image will come up as `collabora/code` when you do a `docker ps`
- The application uses Nextcloud for file management and viewing. It essentially calls other backends to process files, but allows us to run Collabora locally with code changes. The Nextcloud docker image will come up as `nextcloud` when you do a `docker ps`.
- These two containers are isolated from each other, and hence, communicate indirectly by using your computer's ip. Under no circumstance must you communicate with these dockerized containers using `localhost`, as it will refer to the container itself.
- Hence, we need nextcloud to allow traffic from our personal ip address, which will change when you change your device or connect to another network.


Find your personal ip using any of the following commands

```bash
# Mac
ipconfig getifaddr en0

# Linux 
hostname -I

# Arch (if connected to WIFI)
ip addr | grep wlan0 


# Arch (if connected to ETHERNET)
ip addr | grep en0

# Windows
ipconfig
```

For the sake of example, assume your ip is `10.0.11.25`

```bash
docker ps

# note down the `CONTAINER ID` of `nextcloud:latest`

docker exec -it <container_id> bash
apt update && apt upgrade && apt install vim
vim config/config.php
```

Update the `trusted_domains` field. The end file should look something like 

```php
<?php
$CONFIG = array (
  'htaccess.RewriteBase' => '/',
  'memcache.local' => '\\OC\\Memcache\\APCu',
  'apps_paths' =>
  array (
    0 =>
    array (
      'path' => '/var/www/html/apps',
      'url' => '/apps',
      'writable' => false,
    ),
    1 =>
    array (
      'path' => '/var/www/html/custom_apps',
      'url' => '/custom_apps',
      'writable' => true,
    ),
  ),
  'upgrade.disable-web' => true,
  'instanceid' => 'octy59sak20h',
  'passwordsalt' => 'Ttp75JoUmoH+eRlNPET2K7ZYLsZFqI',
  'secret' => 'd9kNzS/WuPqowyiGu8UuZulgXvYJ7DSWuGVS0tkh8AVt2557',
  'trusted_domains' =>
  array (
	  0 => 'localhost:8081',
	  1 => '10.0.11.25'
  ),
  'datadirectory' => '/var/www/html/data',
  'dbtype' => 'sqlite3',
  'version' => '31.0.9.1',
  'overwrite.cli.url' => 'http://localhost:8081',
  'installed' => true,
);
```

# 2. Configuring Nextcloud to use Collabora

- Using your public ip, on any browser go to `http://<your_ip>:8081`
- Create a nextcloud account.
- Click on the top right user icon and go to `+ Apps`
- Under `Discover` section, click on `Nextcloud Office` and then `Download and enable`. You may need to refresh the page.
- Click on the top right user icon again, and this time navigate to `Administration Settings`. Navigate to subheader named `Office`.
- Select `Use your own server` and add the URL `http://<your_ip>:9980` and click save. Optionally you can also scroll down to `Advanced settings` and select `Use Office Open XML (OOXML) instead of OpenDocument Format (ODF) by default for new files`. It will make `.xlsx` the default.

Congratulations. Things should be setup for you now. You can go to `Files` (Folder icon on top left) and select `+ New` to create a spreadsheet. The spreadsheet will open using Collabora Backend.

Happy coding :)