import requests
from bs4 import BeautifulSoup
import re

def test_scrape():
    url = "https://www.examkits.com/jamb/past_questions/index.php?subj=mathematics&y=2024&q=1"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    
    print(f"Testing scraper on: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Failed to fetch.")
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Test question text - try h1 or h3 based on markdown inspection
        q_text_element = soup.find('h3') 
        if not q_text_element or "Examkit's" in q_text_element.text:
            # Fallback to h1 or looking for text after "Question X:"
            q_text_element = soup.find('h1')
            
        if q_text_element:
            text = q_text_element.get_text(strip=True)
            # Strip "Question X: " prefix if present in H1
            if "Question " in text and ":" in text:
                text = text.split(":", 1)[1].strip()
            print(f"Question found: {text[:70]}...")
        else:
            print("Question text NOT found.")

        # Test options
        labels = soup.find_all('label', class_='ml-3')
        print(f"Options found: {len(labels)}")
        for i, label in enumerate(labels):
            print(f"  Option {chr(ord('A') + i)}: {label.get_text(strip=True)}")

        # Test answer-box
        answer_box = soup.find('div', class_='answer-box')
        if not answer_box:
            # Maybe it's not in answer-box div but follows h4
            answer_box = soup.find('body') # Search whole body if needed

        if answer_box:
            h4s = soup.find_all('h4')
            for h4 in h4s:
                if "Correct Answer" in h4.text:
                    ans = h4.find_next_sibling(text=True) or h4.get_text()
                    print(f"Correct Answer identified: {ans.replace('Correct Answer', '').strip()}")
                if "Explanation" in h4.text:
                    exp = h4.find_next_sibling(text=True) or h4.find_next('p')
                    print(f"Explanation found: {str(exp)[:50]}...")
        else:
            print("Answer container NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scrape()
