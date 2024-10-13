import pandas as pd
import json
# Load the Excel file
#file_path = '/Users/shepherd/Desktop/rawdata.xlsx'
file_path = '/Users/shepherd/Desktop/rawdata.xlsx'

# Read the Excel sheet into a DataFrame
df = pd.read_excel(file_path, header = None)
wordlist = {}
all_a = [chr(i + ord("a")) for i in range(26)]

for i, row in df.iterrows():
    family, mass = row
    mass = mass.split(",")
    
    members = []
    for member in mass:
        member = member.strip()

        selected = ""
        for a in member:
            if a in all_a:
                selected += a
            else: break
        member = selected

        members.append(member)

    wordlist.update({family : members})

with open('data.json', 'w') as json_file:
    json.dump(wordlist, json_file, indent=4)

