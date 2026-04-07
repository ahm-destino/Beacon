import requests
from bs4 import BeautifulSoup

url = "https://www.examkits.com/jamb/past_questions/index.php?subj=english&y=2000&q=16"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

container = soup.find('div', class_='border-l-4')
if container:
    print("Container structure:")
    for child in container.children:
        if child.name:
            print(f"<{child.name} class='{child.get('class')}'>: {child.get_text(strip=True)[:100]}")
else:
    print("Container NOT found.")
