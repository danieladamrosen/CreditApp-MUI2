import requests
import os
import base64

token = os.environ.get('GITHUB_TOKEN')
headers = {'Authorization': f'token {token}'}

skip_files = {'.replit', 'replit.nix'}

def download_file(url, path):
    if not path or path in skip_files:
        return
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get('content'):
            content = base64.b64decode(data['content'])
            dir_path = os.path.dirname(path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
            
            # Check if it's a binary file
            try:
                text_content = content.decode('utf-8')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text_content)
            except UnicodeDecodeError:
                # Binary file
                with open(path, 'wb') as f:
                    f.write(content)
            print(f'Downloaded: {path}')

def download_directory(api_url, local_path=''):
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        items = response.json()
        for item in items:
            if local_path:
                item_path = os.path.join(local_path, item['name'])
            else:
                item_path = item['name']
            
            if item['type'] == 'file' and item['name'] not in skip_files:
                download_file(item['url'], item_path)
            elif item['type'] == 'dir':
                download_directory(item['url'], item_path)

download_directory('https://api.github.com/repos/danieladamrosen/CreditApp-MUI/contents')