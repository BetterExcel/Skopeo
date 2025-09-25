# Skopeo Project Setup Guide for Teammates

## 🚀 Quick Setup Steps

### 1. Clone the Repository
```bash
git clone --recurse-submodules ...
cd Skopeo
```

### 2. Update docker-compose.yml
**CRITICAL:** Add the `aliasgroups1` line to the Collabora environment:

```yaml
services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    restart: always
    ports:
      - "8081:80"
    volumes:
      - nextcloud_data:/var/www/html

  collabora_online:
    build:
      context: ./src/view
      dockerfile: docker/from-packages/Dockerfile
    image: collabora/code
    container_name: collabora_online
    restart: always
    tty: true
    ports:
      - "9980:9980"
    environment:
      - extra_params=--o:ssl.enable=false --o:user_interface.use_integration_theme=false
      - aliasgroups1=http://nextcloud:80,http://YOUR_LOCAL_IP:8081,http://localhost:8081

volumes:
  nextcloud_data:
```

### 3. Find Your Local IP Address
```bash
# Mac
ipconfig getifaddr en0

# Linux 
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr "IPv4"
```

### 4. Update the aliasgroups1 line
Replace `YOUR_LOCAL_IP` with your actual IP address from step 3.

Example: If your IP is `192.168.1.100`, use:
```yaml
- aliasgroups1=http://nextcloud:80,http://192.168.1.100:8081,http://localhost:8081
```

### 5. Run Setup Script and Start Containers
```bash
# Run Python setup
./scripts/setup.sh

# Start containers
docker-compose up -d
```

### 6. Configure Nextcloud
1. Go to `http://YOUR_LOCAL_IP:8081` or `http://localhost:8081`
2. Create admin account during initial setup
3. Install "Nextcloud Office" app from the Apps section
4. Go to Administration Settings → Office
5. Set Collabora URL to: `http://YOUR_LOCAL_IP:9980`

---

## 🔧 Why These Changes Were Necessary

### The Problem We Solved
- **WOPI Host Authorization Error**: Collabora was rejecting Nextcloud's requests
- **Container Communication Issues**: Containers couldn't talk to each other properly
- **Trusted Domain Errors**: Nextcloud wasn't accepting connections from your IP

### The Solutions Applied
1. **Added aliasgroups1**: Tells Collabora which hosts are authorized to make WOPI requests
2. **Proper IP Configuration**: Each teammate needs their own local IP in the config
3. **Simplified Architecture**: Removed complex nginx proxy for local development

---

## 🚨 Common Issues & Solutions

### Issue: "Document loading failed" / "Unauthorized WOPI host"
**Solution**: Make sure your local IP is correctly set in `aliasgroups1`

### Issue: "Access through untrusted domain"
**Solution**: This will be automatically fixed when you complete the Nextcloud setup

### Issue: Containers not starting
**Solution**: 
```bash
docker-compose down
docker-compose up -d
```

### Issue: Collabora not connecting
**Solution**: Verify your IP is correct and restart containers

---

## 📋 Verification Steps

After setup, verify everything works:

1. **Check containers are running**:
   ```bash
   docker ps
   ```
   You should see both `nextcloud` and `collabora_online` containers.

2. **Test Nextcloud access**:
   - Go to `http://YOUR_LOCAL_IP:8081`
   - Should show Nextcloud interface (not errors)

3. **Test Collabora integration**:
   - In Nextcloud, go to Files → + New → Spreadsheet
   - Should open in Collabora editor (not show errors)

4. **Verify configuration**:
   ```bash
   docker exec nextcloud php occ richdocuments:activate-config
   ```
   Should show all green checkmarks.




