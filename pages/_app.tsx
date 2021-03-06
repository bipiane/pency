import React from "react";
import App from "next/app";
import * as Sentry from "@sentry/browser";
import {Flex, ThemeProvider, CSSReset} from "@chakra-ui/core";

import ErrorScreen from "./_error";

import {Provider as ProductProvider} from "~/product/context";
import {Provider as TenantProvider} from "~/tenant/context";
import {Provider as I18nProvider} from "~/i18n/context";
import {Provider as CartProvider} from "~/cart/context";
import {Provider as AnalyticsProvider} from "~/analytics/context";

if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

export default class Pency extends App {
  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag("origin", "componentDidCatch");

        Object.keys(errorInfo).forEach((key) => {
          scope.setExtra(key, errorInfo[key]);
        });

        scope.setExtra("error", error);

        Sentry.captureException(error);
      });
    }

    super.componentDidCatch(error, errorInfo);
  }

  render() {
    const {Component, pageProps} = this.props;
    const {tenant, products, statusCode: error} = pageProps;

    return (
      <ThemeProvider>
        <CSSReset />
        {error ? (
          <ErrorScreen statusCode={error} />
        ) : tenant && products ? (
          <TenantProvider initialValue={tenant}>
            <I18nProvider>
              <Flex direction="column" height="100%">
                <ProductProvider initialValues={products}>
                  <AnalyticsProvider>
                    <CartProvider>
                      <Component {...pageProps} />
                    </CartProvider>
                  </AnalyticsProvider>
                </ProductProvider>
              </Flex>
            </I18nProvider>
          </TenantProvider>
        ) : (
          <Component {...pageProps} />
        )}
      </ThemeProvider>
    );
  }
}
