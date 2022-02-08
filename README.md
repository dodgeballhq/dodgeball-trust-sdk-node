# Dodgeball Server Trust SDK for NodeJS

The Dodgeball Server Trust SDK allows you to decouple trust and safety requirements from your application code. Dodgeball serves as an abstraction layer for the various integrations your application requires when performing risky actions. For example, instead of directly integrating fraud engines, 2FA, KYC providers, and bot prevention solutions into your application, use Dodgeball to decouple these requirements from your application code. Your trust and safety teams focus on ensuring your application is safe and secure, and you focus on your application's business logic. When threats evolve or new vulnerabilities are identified, your application can be updated to mitigate these risks without having to change a single line of code or add support for a new integration.

Check out the [Dodgeball Trust Client SDK](https://npmjs.com/package/@dodgeball/trust-sdk-client) for how to integrate Dodgeball into your client applications.

## Installation
Use `npm` to install the Dodgeball module:
```sh
npm install @dodgeball/trust-sdk-server
```

Alternatively, using `yarn`:
```sh
yarn add @dodgeball/trust-sdk-server
```

## Usage

```ts
import { Dodgeball } from '@dodgeball/trust-sdk-server';
import express from 'express';

const app = express();
const dodgeball = new Dodgeball(process.env.DODGEBALL_SECRET_KEY);

app.post('/api/orders', async (req, res) => {
  // Call the Dodgeball API to verify the event is allowed to proceed
  const verifyResponse = await dodgeball.verify({
    workflow: {
      type: 'PLACE_ORDER',
      data: {
        order: req.body.order
      }
    },
    dodgeballId: req.body.dodgeballId,
    useVerification: req.body.verification,
    options: {
      sync: true
    }
  });

  if (dodgeball.isAllowed(verifyResponse)) {
    const placedOrder = await database.createOrder(req.body.order); // Proceed with placing the order
    return res.status(200).json({
      order: placedOrder
    });
  } else if (dodgeball.isPending(verifyResponse)){
    return res.status(202).json({
      verification: verifyResponse.verification
    });
  } else if (dodgeball.isDenied(verifyResponse)){
    return res.status(403).json({
      verification: verifyResponse.verification
    });
  } else {
    return res.status(500).json({
      message: verifyResponse.errors
    });
  }
});

app.listen(process.env.APP_PORT, () => {
  console.log(`Listening on port ${process.env.APP_PORT}`);
});
```