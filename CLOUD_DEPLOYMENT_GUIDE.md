# Cloud Deployment & Content Management Guide

This guide walks you through:
1. **Changing and customizing your content** (via YouTube Auto-Sync, Creator Studio, or bulk replacement).
2. **Deploying to Oracle Cloud Always Free VM** (zero monthly hosting cost forever).

---

## 1. How to Change & Replace the Content

You now have three easy ways to customize the content in your app:

### Method A: YouTube Auto-Sync (Recommended for Videos)
1. Open your app at `http://127.0.0.1:5173/`.
2. Click **Sign In** → **Enter as Creator (Admin)**.
3. Click the **Creator Studio** tab in the top navigation.
4. Select the **YouTube Auto-Sync** sub-tab:
   - **Single Video**: Paste any public or unlisted YouTube video URL. The app automatically pulls the title, thumbnail, duration, and sets up the meditation player.
   - **Channel or Playlist**: Paste your YouTube Channel ID or Playlist URL (e.g. `https://www.youtube.com/playlist?list=PL...`). All videos are automatically imported in seconds.

### Method B: Manual Publishing via Creator Studio
- In the **Manual Publishing** tab of Creator Studio, you can:
  - Add audio meditations with MP3 URLs and reflection notes.
  - Publish blog articles formatted with full Markdown (`# headings`, `*italics*`, `**bold**`, `> quotes`).
  - Assign teachers and topic tags (*Anxiety, Sleep, Breath, Loving-Kindness*).

### Method C: Start 100% Fresh (Wipe Sample Data)
- In Creator Studio, click the **Manage / Replace Content** tab.
- Click **Clear Sample Content**. All dummy starter practices will be erased from the database so you can start from a clean canvas.

---

## 2. Deploying to Oracle Cloud Always Free VM

Oracle Cloud offers an **Always Free Tier** that includes:
- **VM.Standard.A1.Flex (ARM Ampere)**: Up to **4 OCPUs** and **24 GB RAM** (plenty of power to run PostgreSQL, FastAPI, and Nginx with room for thousands of concurrent users at $0 cost).
- **200 GB** free block volume storage.
- **10 TB/month** free outbound bandwidth.

### Step 1: Create an Oracle Cloud Account & Provision VM
1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
2. In the Oracle Cloud Console, navigate to: **Compute** → **Instances** → **Create Instance**.
3. **Image and Shape**:
   - Image: Select **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS (Minimal or Standard)**.
   - Shape: Click **Change Shape** → Select **Ampere (ARM)** → `VM.Standard.A1.Flex` (allocate 2 to 4 OCPUs and 12GB to 24GB RAM — marked with the green "Always Free Eligible" tag).
4. **Networking**:
   - Assign a public IPv4 address.
5. **Add SSH Keys**:
   - Download the generated private key (`ssh-key-*.key`) to your computer.
6. Click **Create** and wait 1–2 minutes for the status to turn green (**RUNNING**). Note the **Public IP Address**.

---

### Step 2: Open Ports 80 & 443 in Oracle Virtual Cloud Network (VCN)
Oracle Cloud blocks incoming web traffic at the network firewall level by default. You must enable HTTP/HTTPS:
1. On your instance page, click on your **Subnet** link (under **Primary VNIC**).
2. Click on the **Default Security List**.
3. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80,443`
   - **Description**: `Allow HTTP and HTTPS web traffic`
4. Click **Add Ingress Rules**.

---

### Step 3: Connect via SSH & Launch
Open PowerShell on your computer and run:

```powershell
# Connect to your Oracle VM (replace with your private key path and VM IP)
ssh -i "path\to\your-ssh-key.key" ubuntu@YOUR_ORACLE_VM_IP
```

Once connected to the VM, clone your project repository and run the setup script:

```bash
# 1. Clone your project code
git clone <YOUR_GIT_REPO_URL> daily-living
cd daily-living

# 2. Make the setup script executable and run it
chmod +x setup-oracle-vm.sh
./setup-oracle-vm.sh
```

The script will automatically:
- Install Docker and Docker Compose.
- Configure local VM firewall rules for ports 80 and 443.
- Build and launch the PostgreSQL, FastAPI, and Nginx containers.

---

### Step 4: Access Your Live Application
- **Web App**: `http://YOUR_ORACLE_VM_IP`
- **Backend API & Swagger Docs**: `http://YOUR_ORACLE_VM_IP/docs`

---

## 3. Connecting a Custom Domain & Free SSL (HTTPS)

Once your VM is running:
1. Point an `A` record from your domain registrar (e.g. `app.yourdomain.com`) to `YOUR_ORACLE_VM_IP`.
2. On your VM, run Certbot to issue a free Let's Encrypt certificate:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d app.yourdomain.com
   ```
3. Update `GOOGLE_CLIENT_ID` in `.env` with your production domain so members can sign in with Google directly.
