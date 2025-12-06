import pandas as pd
import json
import os

try:
    # Read Excel file
    df = pd.read_excel('Example data sets.xlsx')
    
    # Clean and prepare data
    # Handle missing values if any
    df = df.fillna('Unknown')
    
    # Ensure numeric columns are actually numeric
    numeric_cols = ['Time in UK (months)', 'Integration Metric']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Convert to list of dicts
    data = df.to_dict(orient='records')
    
    # Create dashboard directory if it doesn't exist (though we'll create the app there soon)
    os.makedirs('dashboard/src', exist_ok=True)
    
    # Save to JSON
    with open('dashboard/src/data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("Data successfully converted to dashboard/src/data.json")
    
except Exception as e:
    print(f"Error converting data: {e}")
