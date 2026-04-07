import json

def check_metadata():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(json.dumps(data.get('metadata', {}), indent=2))

if __name__ == '__main__':
    check_metadata()
