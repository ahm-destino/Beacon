import requests
from bs4 import BeautifulSoup

url = "https://www.examkits.com/jamb/past_questions/index.php?subj=english&y=2000&q=1"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Check for modal-body
modal = soup.find('div', class_='modal-body')
if modal:
    print("Found Modal Body!")
    print(modal.get_text(strip=True)[:200])
else:
    print("Modal Body NOT found in static HTML.")

# Check for any candidates for passage
buttons = soup.find_all('button', class_='btn-primary')
print(f"Found {len(buttons)} primary buttons.")
for b in buttons:
    print(f"Button text: {b.get_text(strip=True)}")

# Find all images
print("\nImages found:")
for img in soup.find_all('img'):
    print(img.get('src'))
