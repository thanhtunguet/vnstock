# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vnstock is a Python toolkit for Vietnamese stock market data and analysis. It provides APIs to access stock prices, company information, financial reports, and more from various data sources (VCI, TCBS, MSN, FMP).

## Development Commands

### Installation
```bash
pip install -e .                    # Install in development mode
pip install -e ".[test]"            # Install with test dependencies
```

### Running Tests
```bash
# Unit tests only (fast, ~4 seconds)
pytest tests/unit/ -m "not integration" -q

# All unit tests with verbose output
pytest tests/unit/ -v

# Specific module tests
pytest tests/unit/core/test_proxy_manager.py -v
pytest tests/unit/explorer/test_vci_quote_comprehensive.py -v

# Run with coverage
pytest tests/unit/ -m "not integration" --cov=vnstock --cov-report=term-missing

# Single test
pytest tests/unit/path/to/test.py::TestClass::test_method -v
```

### Test Markers
- `@pytest.mark.unit` - Fast, isolated tests
- `@pytest.mark.integration` - Real API calls (skip by default)
- `@pytest.mark.slow` - Tests taking >5 seconds
- `@pytest.mark.vci`, `@pytest.mark.tcbs`, `@pytest.mark.msn` - Source-specific tests

## Architecture

### Layer Structure
```
vnstock/
├── api/              # Adapter layer - unified interface across data sources
│   ├── quote.py      # Quote adapter (delegates to explorer providers)
│   ├── company.py    # Company adapter
│   ├── financial.py  # Finance adapter
│   ├── listing.py    # Listing adapter
│   ├── trading.py    # Trading adapter
│   └── screener.py   # Screener adapter
│
├── explorer/         # Provider implementations per data source
│   ├── vci/          # VCI data source (Quote, Company, Finance, Listing, Trading)
│   ├── tcbs/         # TCBS data source (Quote, Company, Finance, Trading, Screener)
│   ├── msn/          # MSN data source (FX, World indices)
│   ├── fmarket/      # Fund data (mutual funds)
│   └── misc/         # Misc utilities (exchange rates, gold prices)
│
├── core/             # Core utilities and infrastructure
│   ├── registry.py   # ProviderRegistry - discovers and manages data providers
│   ├── utils/        # Utility modules (lookback, proxy, user_agent, parser)
│   ├── types.py      # Type definitions
│   └── exceptions.py # Custom exceptions
│
├── common/           # Shared client code
│   └── client.py     # Vnstock main entry point class
│
└── connector/        # Additional provider connectors
```

### Provider Registry Pattern

The codebase uses a registry pattern to dynamically discover and load data providers:

1. **BaseAdapter** (`base.py`): Abstract base class that uses `ProviderRegistry` to instantiate providers
2. **ProviderRegistry** (`core/registry.py`): Central registry that maps (module_name, source) to provider classes
3. **Explorer modules**: Register themselves with the registry on import

Example flow:
```python
from vnstock import Quote
quote = Quote(symbol='ACB', source='VCI')  # Adapter looks up VCI provider from registry
quote.history(start='2024-01-01')          # Delegates to VCI Quote implementation
```

### Unified Interface vs Direct Import

Two ways to use the library:

```python
# 1. Unified interface (recommended) - source-agnostic
from vnstock import Vnstock
stock = Vnstock().stock(symbol='ACB', source='VCI')
stock.quote.history(...)

# 2. Direct import from explorer - fixed source
from vnstock.explorer.vci import Quote
quote = Quote(symbol='ACB')
quote.history(...)
```

## Testing Patterns

### Fixtures
Located in `tests/conftest.py` and `tests/fixtures/symbols.py`:
- `mock_response_factory` - Create mock HTTP responses
- `random_hose_symbols`, `random_hnx_symbols` - Real symbols for testing
- `diverse_test_symbols` - 30 symbols across exchanges

### Mocking External APIs
```python
from unittest.mock import patch

@patch('vnstock.explorer.vci.quote.requests.get')
def test_quote(mock_get, mock_response_factory):
    mock_get.return_value = mock_response_factory(json_data={'close': 100.0})
    # Test code here
```

## Key Concepts

### Data Sources
- **VCI**: Primary source for Vietnamese stocks, supports most features
- **TCBS**: Alternative source with screener functionality
- **MSN**: International markets, FX, indices
- **FMarket**: Mutual fund data

### Smart Lookback Feature
`Quote.history()` supports flexible time periods via `length` parameter:
- `'3M'` - 3 months
- `'10W'` - 10 weeks
- `'100b'` - 100 trading bars
- `150` - 150 bars

### Proxy Support
All VCI modules support proxy configuration for cloud platforms:
```python
Quote(symbol='ACB', proxy_mode='AUTO', proxy_list=[...])
```
