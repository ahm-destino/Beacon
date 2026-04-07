import json
import time
import os
import sys

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    print("Starting Beacon Live Scraper Monitor...")
    while True:
        try:
            with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            qs = data.get('questions', [])
            meta = data.get('metadata', {}).get('summary', {})
            
            clear_screen()
            print("="*60)
            print(" BEACON SCRAPER LIVE DASHBOARD ".center(60, "="))
            print("="*60)
            print(f"Total Questions Saved: {len(qs):,}")
            
            curr_p = meta.get('current_processing')
            if curr_p:
                print(f"Currently Fetching:    {curr_p.get('subject')} {curr_p.get('year')} Q{curr_p.get('question_number')}")
            
            print("\n--- Last 5 Saved Questions ---")
            if len(qs) >= 5:
                for q in qs[-5:]:
                    subj = q.get('subject', '').upper()
                    year = q.get('year')
                    num = q.get('question_number')
                    text = str(q.get('question_text', ''))[:50].replace('\n', ' ')
                    print(f"[{subj} {year}] Q{num}: {text}...")
            else:
                print("Not enough questions yet.")
                
            print("\nUpdating every 2 seconds. Press Ctrl+C to exit.")
            
        except json.JSONDecodeError:
            print("Warning: Currently saving batch to file, retrying...")
        except Exception as e:
            print(f"Error reading file: {e}")
            
        time.sleep(2)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nMonitor stopped.")
        sys.exit(0)
