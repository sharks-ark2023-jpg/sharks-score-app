
# Soccer Match Recorder

This is a high-performance web application for recording and managing soccer team match results.

## Features

-   **Dashboard**: View overall team stats and top scorer rankings.
-   **Match Recording**: Record match results in real-time or after the match.
-   **Expanded Score Formats**: Differentiate between "Official" matches (with first-half and final scores) and "Training Matches (TM)" (with final scores only).
-   **Match List**: Browse all recorded matches with detailed score displays.
-   **Player Management**: View a list of players loaded from a Google Sheet.
-   **Settings**: Customize your team name and manage application data.

## Google Sheets Setup Guide

This application uses Google Sheets as a database. You need to set up a Google Sheet with the correct format for the application to work correctly.

### 1. Create a Google Sheet

Create a new Google Sheet in your Google Drive.

### 2. Set Up Sheets (Tabs)

Create two sheets (tabs) at the bottom of your Google Sheet and name them exactly as follows:

1.  `試合結果` (Match Results)
2.  `選手一覧` (Player List)

### 3. Configure Columns for `試合結果` (Match Results)

In the `試合結果` sheet, create the following 12 columns in row 1. The order and names must be exact.

| Column | Header           | Description                                             | Example                                    |
| :----- | :--------------- | :------------------------------------------------------ | :----------------------------------------- |
| A      | ID               | A unique ID for each match (automatically generated).   | `d9f8c7b6-a5e4-4d3c-8b2a-1f0e9d8c7b6a`      |
| B      | 日付             | The date of the match.                                  | `2024-07-28`                               |
| C      | 会場             | The venue where the match was played.                   | `City Stadium`                             |
| D      | ホームチーム     | The name of the home team.                              | `My Team FC`                               |
| E      | アウェイチーム   | The name of the away team.                              | `Rival United`                             |
| F      | ホーム最終スコア | The final score for the home team.                      | `3`                                        |
| G      | アウェイ最終スコア | The final score for the away team.                      | `1`                                        |
| H      | ホーム前半スコア | The first-half score for the home team (Official only). | `1`                                        |
| I      | アウェイ前半スコア | The first-half score for the away team (Official only). | `0`                                        |
| J      | 得点者           | Comma-separated list of scorers.                        | `Player A,Player B,Player A`               |
| K      | 試合種別         | The type of match: `公式` or `TM`.                      | `公式`                                     |
| L      | 大会名           | The name of the competition (Official only).            | `League Cup`                               |

### 4. Configure Columns for `選手一覧` (Player List)

In the `選手一覧` sheet, list your players' names in the first column (Column A), starting from row 1.

| Column | Header (Optional) | Description         |
| :----- | :---------------- | :------------------ |
| A      | 選手名            | The player's name.  |

**Example:**
-   Cell A1: `Player A`
-   Cell A2: `Player B`
-   Cell A3: `Player C`

### 5. Environment Variables

You will need to set up environment variables for the Vercel serverless functions to connect to your Google Sheet.

-   `GOOGLE_SHEET_ID`: The ID of your Google Sheet.
-   `GOOGLE_SHEETS_CLIENT_EMAIL`: The client email from your Google Cloud service account.
-   `GOOGLE_SHEETS_PRIVATE_KEY`: The private key from your Google Cloud service account.

Once configured, the application will be able to read and write data to your sheet.
