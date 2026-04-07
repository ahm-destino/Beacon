import requests
from bs4 import BeautifulSoup

url = "https://www.examkits.com/jamb/past_questions/index.php?subj=english&y=2000&q=1"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Find the main question text first
q_text = soup.find('h3') or soup.find('h1')
if q_text:
    print(f"Question text found: {q_text.get_text(strip=True)[:50]}")
    # Print the classes of all parent divs
    curr = q_text
    while curr.parent:
        curr = curr.parent
        if curr.name == 'div':
            print(f"Parent div classes: {curr.get('class')}")
        if curr.name == 'body': break
else:
    print("Question text NOT found.")
