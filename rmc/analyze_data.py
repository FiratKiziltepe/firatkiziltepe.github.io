import pandas as pd

try:
    df = pd.read_excel('Example data sets.xlsx')
    print("Columns:")
    print(df.columns.tolist())
    print("\nData Types:")
    print(df.dtypes)
    print("\nFirst 5 rows:")
    print(df.head().to_string())
    print("\nSummary Statistics:")
    print(df.describe(include='all').to_string())
except Exception as e:
    print(f"Error reading file: {e}")
