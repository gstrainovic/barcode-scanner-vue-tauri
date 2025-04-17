import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

sentry_sdk.init(
    dsn="https://d072194fec4899f3b5b2331bc68ac492@o4505812863418368.ingest.sentry.io/4505812867547136",
    integrations=[LoggingIntegration()],
    release="your_project_release",  # Ersetzen Sie dies durch Ihre tatsächliche Release-Version
    traces_sample_rate=1.0
)
