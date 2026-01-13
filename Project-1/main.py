import requests

def get_weather(city):
    # This uses a free, no-key-required weather API (wttr.in)
    url = f"https://wttr.in/{city}?format=3"
    try:
        response = requests.get(url)
        print(f"\n--- {city.capitalize()} ---")
        print(response.text)
    except Exception as e:
        print(f"Error fetching weather: {e}")

if __name__ == "__main__":
    city_name = input("Enter a city name (e.g., London): ")
    get_weather(city_name)