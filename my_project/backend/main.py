from __future__ import annotations

from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vnstock import Quote

app = FastAPI(title="vnstock-backend")


class QuoteResponse(BaseModel):
    symbol: str
    dates: list[str]
    closes: list[float]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/quote", response_model=QuoteResponse)
def quote(symbol: str = "ACB", days: int = 365) -> QuoteResponse:
    end = date.today()
    start = end - timedelta(days=days)

    quote_client = Quote(symbol=symbol, source="VCI")
    df = quote_client.history(
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        interval="1D",
    )

    if "time" in df.columns:
        dates = df["time"].astype(str).tolist()
    elif "date" in df.columns:
        dates = df["date"].astype(str).tolist()
    else:
        dates = df.index.astype(str).tolist()

    if "close" in df.columns:
        closes = df["close"].tolist()
    elif "close_price" in df.columns:
        closes = df["close_price"].tolist()
    elif "closePrice" in df.columns:
        closes = df["closePrice"].tolist()
    else:
        closes = df.iloc[:, -1].tolist()

    return {"symbol": symbol, "dates": dates, "closes": closes}
