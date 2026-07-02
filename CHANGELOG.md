# Changelog

## [5.0.0-rc.2](https://github.com/jvhellemondt/arts-and-crafts/compare/v5.0.0-rc.1...v5.0.0-rc.2) (2026-07-02)

### Features

* add IntegrationEvent & publishing ([d439239](https://github.com/jvhellemondt/arts-and-crafts/commit/d4392393ba74c6629e7022489b27b43759689639))

## [5.0.0-rc.1](https://github.com/jvhellemondt/arts-and-crafts/compare/v3.19.0...v5.0.0-rc.1) (2026-06-24)

### Features

* add a type to failure type and update accordingly ([1027beb](https://github.com/jvhellemondt/arts-and-crafts/commit/1027beb847e078586ec32601bb43609c70ca1f58))
* add and implement schema to createOpenMembershipInboundHonoAdapter ([85142d2](https://github.com/jvhellemondt/arts-and-crafts/commit/85142d2e78a3ba9e31cf4186f7ed6db2ef1a4b54))
* add AppendsDomainEvents to InMemoryEventStore example ([2f52839](https://github.com/jvhellemondt/arts-and-crafts/commit/2f52839bdf29e8ac678fb96ddffd611c26e34d71))
* add countries-list ([109cf24](https://github.com/jvhellemondt/arts-and-crafts/commit/109cf24f2a8fea5b679b0af12a99734d29e8bb08))
* add Evolves and InitializesState ([ebbf07f](https://github.com/jvhellemondt/arts-and-crafts/commit/ebbf07f41ea5b20ce95105cd2305a3e55bdf90b8))
* add membership state and its value objects ([2798f77](https://github.com/jvhellemondt/arts-and-crafts/commit/2798f77c3457799cb7c49063e049bea76639ad44))
* add MembershipDoesNotAlreadyExist specification ([244eb51](https://github.com/jvhellemondt/arts-and-crafts/commit/244eb51a39182c1aedb14322eaea05349c9b441c))
* add more adapter/usecase/core shapes ([01a3683](https://github.com/jvhellemondt/arts-and-crafts/commit/01a36834ccb89ec6caa97d55b69c9d36356abb26))
* add OpenMembership command ([4a90569](https://github.com/jvhellemondt/arts-and-crafts/commit/4a90569ddb751e604b4bfb4cc418d7260cf98e18))
* add option to overwrite timestamp in an integration event ([325766e](https://github.com/jvhellemondt/arts-and-crafts/commit/325766ec3ae1521ecea043b21a478063971163cc))
* add oxfmt to workflow ([cdba9c7](https://github.com/jvhellemondt/arts-and-crafts/commit/cdba9c749f44d8f8b47f61d487204ccf815031d3))
* add SatisfiedBy ([9ee1375](https://github.com/jvhellemondt/arts-and-crafts/commit/9ee1375b51206525e937aa004b24144059fdd8c4))
* add Specification shape ([b96adaa](https://github.com/jvhellemondt/arts-and-crafts/commit/b96adaa5637dd9679a9742142bec64d67d3f0882))
* add uuid ([13f2386](https://github.com/jvhellemondt/arts-and-crafts/commit/13f2386f94424045013cb68b65d0d8c306fae5a9))
* apply DCB to listMemberships projection ([1dc3aae](https://github.com/jvhellemondt/arts-and-crafts/commit/1dc3aae3d4de278a13c96d63a14f58abbde8a7cf))
* apply DCB to OpenMembershipHonoAdapter ([c586cda](https://github.com/jvhellemondt/arts-and-crafts/commit/c586cdaf3980490ea1587699870cd6ab6b983445))
* apply further consequences of dcb to storedEvent and Command shapes ([5e4a493](https://github.com/jvhellemondt/arts-and-crafts/commit/5e4a493bdc87b525ca9c36459be1f740e1ddda5a))
* convert repository to command specific repository ([8d78f34](https://github.com/jvhellemondt/arts-and-crafts/commit/8d78f34abac5f77f5a9fb1fa294baf76731f3246))
* convert to command specific state/evolve ([e5b6278](https://github.com/jvhellemondt/arts-and-crafts/commit/e5b62788206fa5b1ecfb6edac596a8799c1884ec))
* create ConsumeEvents, EventTail, PublishEvents and RegisterEventSubscriber ([0b786db](https://github.com/jvhellemondt/arts-and-crafts/commit/0b786db7043969b36e0050f929fe519a06cfa9e6))
* create membershipStatus value object ([c420fe9](https://github.com/jvhellemondt/arts-and-crafts/commit/c420fe902c6d5e7c1b7927f3259bbbbb1599f02c))
* **EventStore:** implement SimulatesFaults ([34ca0a1](https://github.com/jvhellemondt/arts-and-crafts/commit/34ca0a1ae425f5ccdf65f347f3a84f6bf5fe954d))
* **EventStore:** should load domain events by given concerns ([d86db56](https://github.com/jvhellemondt/arts-and-crafts/commit/d86db56607540c2fd484ed4fa0c4f5b536da7648))
* examples skeleton ([7614a67](https://github.com/jvhellemondt/arts-and-crafts/commit/7614a671c6f67f69c007c7e5a9e4139bcd2b9faf))
* export all Membership V1 events ([c9ef599](https://github.com/jvhellemondt/arts-and-crafts/commit/c9ef599def749798d86d987e4b2b6d01619e6454))
* finalize EventStore example ([b3ba54e](https://github.com/jvhellemondt/arts-and-crafts/commit/b3ba54e4c9b22b35215102bc3388f434112286b1))
* finalize openMembership decision ([554ab15](https://github.com/jvhellemondt/arts-and-crafts/commit/554ab159375f6a72ed44a710c8c2b21722ea22b2))
* further implement consequences of DCB into message and domain event ([db1e01e](https://github.com/jvhellemondt/arts-and-crafts/commit/db1e01eeb365a56bd256de5d06cbd0ce0f45aad5))
* further implement DCB into module shapes ([2cc4fb2](https://github.com/jvhellemondt/arts-and-crafts/commit/2cc4fb245a9993a4652c2b2ea762cf96acc95152))
* **http:** openMembershipHandlerRoute.POST ([5b3e02d](https://github.com/jvhellemondt/arts-and-crafts/commit/5b3e02d78f8121a47ca71358cc06d869c53d3f44))
* implement command handler in adapter ([5a79799](https://github.com/jvhellemondt/arts-and-crafts/commit/5a797995cfebf3c3a6e148303fcd3c28b7772b22))
* implement createStreamKey ([93664ff](https://github.com/jvhellemondt/arts-and-crafts/commit/93664ff368094dd0df64c9df0d4870bebb74d895))
* implement decideOpenMembership ([13de9b0](https://github.com/jvhellemondt/arts-and-crafts/commit/13de9b0fc446b89ada6a131377666fa0fcdb6ffc))
* implement findConcern utility ([3d32acb](https://github.com/jvhellemondt/arts-and-crafts/commit/3d32acb6066eeecf4bdd8a0510d835cc05f62964))
* initial v5 package ([e8d874c](https://github.com/jvhellemondt/arts-and-crafts/commit/e8d874c7a855f1b1b37cde03a5bb1161d6563d69))
* intent-outbox should stage intents ([a3f1f66](https://github.com/jvhellemondt/arts-and-crafts/commit/a3f1f662f6badb41a9aab9774ef60ccbd41b8cb0))
* **IntentOutbox:** implement SimulateFaults and make stage generator ([cd93ba7](https://github.com/jvhellemondt/arts-and-crafts/commit/cd93ba7830a61295ac2ab355c7faef1af821f393))
* isFailure util ([adb979d](https://github.com/jvhellemondt/arts-and-crafts/commit/adb979d19991f27a911d1f4f12a5595542326eab))
* **listMemberships:** list all memberships if query is undefined ([fc1617c](https://github.com/jvhellemondt/arts-and-crafts/commit/fc1617cfe9fe3025c97fcb5371990016ccf4de42))
* make eventStore and outbox batchable ([ea534a3](https://github.com/jvhellemondt/arts-and-crafts/commit/ea534a3374c94593ecdbef2a9e64f795a2173c0a))
* membership evolve ([1ef97ba](https://github.com/jvhellemondt/arts-and-crafts/commit/1ef97ba235ce834f02efc68ab38e7441b9a2fddf))
* membership repository ([7adaae8](https://github.com/jvhellemondt/arts-and-crafts/commit/7adaae8febdcd958e889e24de2c1bd54481b4388))
* **MembershipOpened:** remove duplicate occurredAt field ([9c30dc9](https://github.com/jvhellemondt/arts-and-crafts/commit/9c30dc9f04e07f439d42b36b01ffac7c609fb417))
* **MembershipRepository:** implement the correct capabilities ([773ddf5](https://github.com/jvhellemondt/arts-and-crafts/commit/773ddf58ddd9d08dfe6aeb9622004f96f2623a95))
* more shapes ([7dcbc50](https://github.com/jvhellemondt/arts-and-crafts/commit/7dcbc509d9ea0cd490af2e437e16fede974ed82f))
* openMembership handler ([a7672b2](https://github.com/jvhellemondt/arts-and-crafts/commit/a7672b2a6eb99cd853b549ed655b3ecb75789d3b))
* **openMembership:** add membership id to command payload ([53fe3e0](https://github.com/jvhellemondt/arts-and-crafts/commit/53fe3e0656eb54e280c24f1aaaef016798407e55))
* **OpenMembership:** export the return type OpenMembershipCommand ([a285502](https://github.com/jvhellemondt/arts-and-crafts/commit/a285502ab471b6a0b9e676c408d95118f726cca5))
* **Outbox:** enable handle notifications ([e754c07](https://github.com/jvhellemondt/arts-and-crafts/commit/e754c0735a3866fb6e05b67b3d77dd06915f9993))
* pivot to dynamic consistency boundary ([ab40937](https://github.com/jvhellemondt/arts-and-crafts/commit/ab4093755569d39e4b0bb075b84b2b171f262c2f))
* remove aggregate* from Intent ([806abc1](https://github.com/jvhellemondt/arts-and-crafts/commit/806abc1cc510e7dca0f99ad6f1bc1d867d5e4f8a))
* set up OpenMembershipAdapter and its shell ([3e949d7](https://github.com/jvhellemondt/arts-and-crafts/commit/3e949d7be0d9009e8832c08f7d7fd8a30dc55dc1))
* StagesIntents ([b0f0cf4](https://github.com/jvhellemondt/arts-and-crafts/commit/b0f0cf4d7a952fa511cc7cd8a2285817ea62411d))
* tidy the createOpenMembershipCommand ([ad13e7a](https://github.com/jvhellemondt/arts-and-crafts/commit/ad13e7a13d28f9a3b079c5e93f9ba99a203489fc))
* update createOpenMembershipRoute to use DCB ([f3d023b](https://github.com/jvhellemondt/arts-and-crafts/commit/f3d023b76e69d09db46044d0b722e327bfa15a51))
* update decide to DCB ([16fe235](https://github.com/jvhellemondt/arts-and-crafts/commit/16fe2357f4cb40bb955e6ec7c411adca0b4c9f48))
* update examples skeleton ([e7a92d8](https://github.com/jvhellemondt/arts-and-crafts/commit/e7a92d86f67a4396954a420e562a2a8e426d68cb))
* update listMemberships to use DCB ([e3c9149](https://github.com/jvhellemondt/arts-and-crafts/commit/e3c91497253b2edadc322d8f79d994178b66732d))
* update OpenMembershipHandler to DCB ([e9cd907](https://github.com/jvhellemondt/arts-and-crafts/commit/e9cd907efbbada65b332c8628dbe92b70331188e))
* update shapes to be more consistent ([c98f925](https://github.com/jvhellemondt/arts-and-crafts/commit/c98f925e52cf82e34e3ee9db96344978b67e43b0))
* update SignedAt to allow offset ([dac5aa7](https://github.com/jvhellemondt/arts-and-crafts/commit/dac5aa712407bd43036f822779fd20e49ca80f81))
* update the decision shape with rejection shape ([e478144](https://github.com/jvhellemondt/arts-and-crafts/commit/e4781446b9385ce21f9e090ddf1e7ee2d400d63c))
* **utils:** isRejection ([26a2007](https://github.com/jvhellemondt/arts-and-crafts/commit/26a200736ca12f2e64984e4b8755a3cb39b7d842))
* **v5:** add HandleIntent policy and IntentRelay that drains the outbox ([4699bc0](https://github.com/jvhellemondt/arts-and-crafts/commit/4699bc02037e6e02ccfbb1b780add1d7725d5caa))
* **v5:** implement listMemberships query end-to-end ([9128df2](https://github.com/jvhellemondt/arts-and-crafts/commit/9128df2ca748dcfcb5d6ce53d80ffeef61bcf1f6))
* **v5:** pivot event identity from stream key to domain payload ([1c0a854](https://github.com/jvhellemondt/arts-and-crafts/commit/1c0a854530b071a47569723596e74993734e9ebb))
* **v5:** publish StoredEvent on the bus and add pull-by-position APIs ([6aea3cd](https://github.com/jvhellemondt/arts-and-crafts/commit/6aea3cdf5de0a7f15ac3fc1faa6e9a4d8401b57f))
* **v5:** wire IntentRelay with email gateway into example shell ([25909c7](https://github.com/jvhellemondt/arts-and-crafts/commit/25909c7c9febed568fd52b9caad118282dbbc62f))

### Bug Fixes

* **v5:** read membershipId from command payload in OpenMembershipHandler ([12eae07](https://github.com/jvhellemondt/arts-and-crafts/commit/12eae07b7683c0f6643af29449d39d85d70f14cf))

## v3.19.0

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.18.0...v3.19.0)

### 🚀 Enhancements

- **getTimestamp:** Use epoch as ms ([3aaf3ab](https://github.com/arts-n-crafts/typescript/commit/3aaf3ab))
- Add-scenario-test-to-v4 ([9700738](https://github.com/arts-n-crafts/typescript/commit/9700738))
- **v4:** Support pure integration events in ScenarioTest when step ([c4fe3cc](https://github.com/arts-n-crafts/typescript/commit/c4fe3cc))

### 💅 Refactors

- **v4:** Remove outbox dependency from example command handlers ([e132a93](https://github.com/arts-n-crafts/typescript/commit/e132a93))

### 📖 Documentation

- Add CLAUDE ([eee4368](https://github.com/arts-n-crafts/typescript/commit/eee4368))
- Add capilot-instructions ([fad762b](https://github.com/arts-n-crafts/typescript/commit/fad762b))
- Update AI instructions ([d1c6f94](https://github.com/arts-n-crafts/typescript/commit/d1c6f94))

### 🏡 Chore

- Export mapXToIntegrationEvent ([fe71685](https://github.com/arts-n-crafts/typescript/commit/fe71685))
- **release:** V3.18.1 ([7405ccd](https://github.com/arts-n-crafts/typescript/commit/7405ccd))
- Add qmd for CLAUDE ([cd1e19f](https://github.com/arts-n-crafts/typescript/commit/cd1e19f))
- Remove Module ([e100eb5](https://github.com/arts-n-crafts/typescript/commit/e100eb5))
- Update claude permissions ([8d33940](https://github.com/arts-n-crafts/typescript/commit/8d33940))
- Solve merge conflicts ([b0d5c43](https://github.com/arts-n-crafts/typescript/commit/b0d5c43))
- Tidying ([6440586](https://github.com/arts-n-crafts/typescript/commit/6440586))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>
- Jvhellemondt <j62676@eon.com>

## v3.18.1

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.18.0...v3.18.1)

### 🏡 Chore

- Export mapXToIntegrationEvent ([fe71685](https://github.com/arts-n-crafts/typescript/commit/fe71685))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.18.0

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.17.1...v3.18.0)

### 🚀 Enhancements

- MapRejectionToIntegrationEvent & mapDomainEventToIntegrationEvent ([14e864e](https://github.com/arts-n-crafts/typescript/commit/14e864e))

### 🏡 Chore

- Enable Decider to have optional TRejection ([4beef9f](https://github.com/arts-n-crafts/typescript/commit/4beef9f))
- Add workspaces to package.json ([4ed1c06](https://github.com/arts-n-crafts/typescript/commit/4ed1c06))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.17.1

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.17.0...v3.17.1)

### 🏡 Chore

- Export the isRejection guard ([c12c6cb](https://github.com/arts-n-crafts/typescript/commit/c12c6cb))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.17.0

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.16.0...v3.17.0)

### 🚀 Enhancements

- CreateRejection and utils ([f227a51](https://github.com/arts-n-crafts/typescript/commit/f227a51))

### 🏡 Chore

- Update deps ([9851385](https://github.com/arts-n-crafts/typescript/commit/9851385))

### ✅ Tests

- Update getTimestamp with TZ ([980f49f](https://github.com/arts-n-crafts/typescript/commit/980f49f))

### 🤖 CI

- Update install script ([0f0b042](https://github.com/arts-n-crafts/typescript/commit/0f0b042))
- Fix release ([5ea2f3a](https://github.com/arts-n-crafts/typescript/commit/5ea2f3a))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.16.0

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.15.0...v3.16.0)

### 🚀 Enhancements

- Update DomainEvent, IntegrationEvent, add ExternalEvent and update accordingly (unverified) ([1452fdb](https://github.com/arts-n-crafts/typescript/commit/1452fdb))
- Update DomainEvent, IntegrationEvent, add ExternalEvent and update accordingly (unverified)" ([ecdd335](https://github.com/arts-n-crafts/typescript/commit/ecdd335))
- Use unix timestamps in DomainEvent and StoredEvent" ([e41f428](https://github.com/arts-n-crafts/typescript/commit/e41f428))
- Directive interface" ([d79f473](https://github.com/arts-n-crafts/typescript/commit/d79f473))
- Directive interface ([ace1557](https://github.com/arts-n-crafts/typescript/commit/ace1557))
- Use unix timestamps in general ([a27aa12](https://github.com/arts-n-crafts/typescript/commit/a27aa12))
- Update DomainEvent, IntegrationEvent, add ExternalEvent and update accordingly ([2280b0b](https://github.com/arts-n-crafts/typescript/commit/2280b0b))

### 💅 Refactors

- Separate Specification interface from CompositeSpecification abstract class" ([eb30a79](https://github.com/arts-n-crafts/typescript/commit/eb30a79))
- Separate Specification interface from CompositeSpecification abstract class ([c11786a](https://github.com/arts-n-crafts/typescript/commit/c11786a))

### 🏡 Chore

- **release:** V3.15.0" ([b6a32dc](https://github.com/arts-n-crafts/typescript/commit/b6a32dc))
- **release:** V3.14.0" ([f1c65ea](https://github.com/arts-n-crafts/typescript/commit/f1c65ea))
- Split into v3 and v4 packages ([8017af0](https://github.com/arts-n-crafts/typescript/commit/8017af0))
- Add check-exports to release-it flow ([5253c71](https://github.com/arts-n-crafts/typescript/commit/5253c71))
- Add lint script to package.json ([06e08ab](https://github.com/arts-n-crafts/typescript/commit/06e08ab))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.13.2

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.13.1...v3.13.2)

### 💅 Refactors

- **Database:** Fix typing defaults (2) ([9221fd1](https://github.com/arts-n-crafts/typescript/commit/9221fd1))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.13.1

[compare changes](https://github.com/arts-n-crafts/typescript/compare/v3.13.0...v3.13.1)

### 💅 Refactors

- **Database:** Fix typing defaults ([772eb61](https://github.com/arts-n-crafts/typescript/commit/772eb61))
- **EventStore:** Fix typing defaults ([23e08ce](https://github.com/arts-n-crafts/typescript/commit/23e08ce))

### 🏡 Chore

- Update package ([e0e3fd2](https://github.com/arts-n-crafts/typescript/commit/e0e3fd2))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.13.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.12.0...v3.13.0)

### 🚀 Enhancements

- Split producer/consumer eventBus ([9cfa134](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9cfa134))
- Implement split producer/consumer eventBus ([2a67f64](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2a67f64))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.12.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.11.0...v3.12.0)

### 🚀 Enhancements

- **AggregateRoot:** Add state- and event-based aggregate roots ([e6587c7](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e6587c7))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.11.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.10.1...v3.11.0)

### 💅 Refactors

- Update ResultTypes to be not promise ([c65f3fe](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c65f3fe))

### 🏡 Chore

- Flexible resultType in domain, core and database, evenstore and repository ([fd5d2ce](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/fd5d2ce))
- Flexible resultType ([a7a846f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/a7a846f))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.10.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.10.0...v3.10.1)

### 💅 Refactors

- Update tying and privacy ([830fc31](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/830fc31))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.10.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.9.0...v3.10.0)

### 🚀 Enhancements

- **StoredEvent:** Should take streamName, and use the id of the event as id ([88f6fb7](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/88f6fb7))

### 💅 Refactors

- Update typing of simple examples ([5f1eed2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/5f1eed2))

### 🏡 Chore

- Update exports and linting ([db8632f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/db8632f))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.9.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.8.2...v3.9.0)

### 🚀 Enhancements

- **Database:** Reimplement Database ([e971df3](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e971df3))
- **EventStore:** Reimplement EventStore ([38bff0c](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/38bff0c))
- **Database:** ResultedDatabase ([3d92e23](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3d92e23))
- **EventStore:** ResultedEventStore ([c02189a](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c02189a))
- **Repository:** Reimplement and add ResultedRepository ([c1885e2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c1885e2))
- **Outbox:** Update to allow flexible ReturnType ([7734259](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/7734259))
- **Module:** Implement changes accordingly ([7358d4c](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/7358d4c))

### 💅 Refactors

- **Database:** Extract WithIdentifier to seperate file and update accordingly ([98be5d0](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/98be5d0))
- **CommandBus:** Update to allow ReturnType ([6d574e2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/6d574e2))
- **Repository:** Update to commandBus changes and delete legacy files ([140608b](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/140608b))
- **QueryBus:** Update to allow flexible returnType ([8be41a8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8be41a8))
- **EventBus:** Update to allow flexible returnType ([5efceb7](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/5efceb7))

### 🏡 Chore

- Add dev oxide.ts ([8416f0c](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8416f0c))
- Remove unused files due to refactors ([8f7b5be](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8f7b5be))
- **DomainEvent:** Update imports and naming of events ([8850b0e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8850b0e))
- Remove scenario test v2 ([b91c6e8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b91c6e8))

### 🎨 Styles

- **CommandBus:** Lint ([fdd6454](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/fdd6454))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.8.2

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.8.1...v3.8.2)

### 💅 Refactors

- **Specification:** Move typing to implementation ([40e2d22](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/40e2d22))
- **Repository:** Move typing to implementation ([23c22eb](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/23c22eb))
- **Decider:** Remove unnecessary typing ([456199d](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/456199d))
- **Query:** Move typing to implementation ([418c462](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/418c462))
- **Database:** Move typing to implementation ([8efd20e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8efd20e))
- **Command:** Move typing to implementation ([096a611](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/096a611))
- Update typings of EventStore, Database, EventBUs ([33fe0e8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/33fe0e8))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.8.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.8.0...v3.8.1)

### 💅 Refactors

- Update ReturnType typing in EventStore and Repository ([7110169](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/7110169))
- **repository:** Tidying ([6da1675](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/6da1675))
- Fix ReturnType type in EventStore, Repository, CommandBus and rename to ReturnType ([e644fdf](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e644fdf))
- Various interfaces should allow flexible ReturnType ([7b7aeb0](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/7b7aeb0))

### 🏡 Chore

- **eslint:** Disable @typescript-eslint/method-signature-style ([44a7f31](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/44a7f31))
- **eslint:** Set @typescript-eslint/method-signature-style to method ([29bee3e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/29bee3e))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.8.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.7.2...v3.8.0)

### 🚀 Enhancements

- Initial v2 ScenarioTest api ([03c8234](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/03c8234))

### 💅 Refactors

- Update EventStore and DomainEvent typing ([e925a61](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e925a61))
- Update repository typing with TResult and rename InMemoryRepository to GenericRepository ([4656fa6](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4656fa6))
- Rename InMemoryOutboxWorker to GenericOutboxWorker ([ebf7ad4](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/ebf7ad4))
- Update the returntype of commandbus, handler and command ([b7286f8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b7286f8))
- Update the returntype of eventbus, handler and event ([bfc3804](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/bfc3804))
- Update the returntype of querybus, handler and query ([bb2ce38](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/bb2ce38))
- Update scenariotest to implement recent changes and tidy commandBus ([4ee2105](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4ee2105))

### 🏡 Chore

- Tidying ([e403457](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e403457))
- Update lint script to only lint src/ ([a24b1b6](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/a24b1b6))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.7.2

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.7.1...v3.7.2)

### 💅 Refactors

- Use OutboxWorker interface in ScenarioTest instead of impl ([52ea0ed](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/52ea0ed))

### ❤️ Contributors

- Jens Van Hellemondt

## v3.7.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.7.0...v3.7.1)

### 🏡 Chore

- Expose OutboxWorker interface ([a7f7bc8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/a7f7bc8))

### ❤️ Contributors

- Jens van Hellemondt

## v3.7.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.6.1...v3.7.0)

### 🚀 Enhancements

- Move away from DatabaseRecord type ([acabafe](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/acabafe))

### 💅 Refactors

- Make the EventStore an interface and do the same for outboxworker ([9fa262d](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9fa262d))

### ❤️ Contributors

- Jens van Hellemondt
- Jens Van Hellemondt <jens@invictus.codes>

## v3.6.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.6.0...v3.6.1)

### 🚀 Enhancements

- Expose IEventStore ([2d20104](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2d20104))

### ❤️ Contributors

- Jens van Hellemondt

## v3.6.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.5.0...v3.6.0)

### 🚀 Enhancements

- **EventStore:** Introduce EventStoreConfig and apply accordingly ([6f47232](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/6f47232))

### 💅 Refactors

- Export Primitive type ([0a31423](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/0a31423))

### 🏡 Chore

- Remove pnpm-lock ([f046833](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/f046833))

### ❤️ Contributors

- Jens van Hellemondt

## v3.5.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.4.1...v3.5.0)

### 🚀 Enhancements

- Eventstore to use database ([84ad41c](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/84ad41c))

### 💅 Refactors

- **eventstore:** Replace implementation with EventStore ([3895cf5](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3895cf5))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.4.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.4.0...v3.4.1)

### 🏡 Chore

- Exports specification pattern ([1500000](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/1500000))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.4.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.3.1...v3.4.0)

### 🚀 Enhancements

- Specification pattern ([3aa7edb](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3aa7edb))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.3.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.3.0...v3.3.1)

### 💅 Refactors

- Expand database record ([4e4346e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4e4346e))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.3.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.2.1...v3.3.0)

### 🚀 Enhancements

- **eventstore:** Separated EventStore and Outbox. Created StoredEvent and OutboxEntry ([503a755](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/503a755))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.2.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.2.0...v3.2.1)

### 💅 Refactors

- **EventStore:** Move generic to methods ([edff33f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/edff33f))

### ❤️ Contributors

- Jens van Hellemondt

## v3.2.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.7...v3.2.0)

### 💅 Refactors

- Move timestamp from metadata to root in command, query and event ([2e09fab](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2e09fab))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.7

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.6...v3.1.7)

### 💅 Refactors

- Updated scenario typing to be generic ([352f258](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/352f258))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.6

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.5...v3.1.6)

### 💅 Refactors

- Updated scenario typing ([7c9af40](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/7c9af40))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.5

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.4...v3.1.5)

### 💅 Refactors

- **eventStore:** Specify typing ([cfd27f5](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/cfd27f5))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.4

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.3...v3.1.4)

### 💅 Refactors

- Update event store to use StreamKey type ([f487055](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/f487055))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.3

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.2...v3.1.3)

### 💅 Refactors

- Make the outboxWorker interfaces exported ([dca2c94](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/dca2c94))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.2

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.1...v3.1.2)

### 🏡 Chore

- **release:** V3.1.1 ([6b9ac79](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/6b9ac79))

### ❤️ Contributors

- Jens van Hellemondt

## v3.1.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.1.0...v3.1.1)

### 💅 Refactors

- Update types of injected properties ([9b9db40](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9b9db40))

### 🏡 Chore

- Remove publish script and integrate into release ([3db055f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3db055f))

### ❤️ Contributors

- Jens van Hellemondt
- Jens Van Hellemondt <jens@invictus.codes>

## v3.1.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.0.3...v3.1.0)

### 🚀 Enhancements

- Separate outbox entry ([770f09a](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/770f09a))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.0.3

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.0.2...v3.0.3)

### 💅 Refactors

- Remove unused eventbus in inmemory event store ([28c0e4e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/28c0e4e))

### 🏡 Chore

- Add publish script to package.json ([ba80199](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/ba80199))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.0.2

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.0.1...v3.0.2)

### 🏡 Chore

- Add utils to export ([9c1ada2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9c1ada2))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.0.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v3.0.0...v3.0.1)

### 💅 Refactors

- Query and command kind-property should not be in metadata ([3d2a779](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3d2a779))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v3.0.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.5.0...v3.0.0)

### 🚀 Enhancements

- **global:** ⚠️  Updated repository, streamKey, outbox pattern+separated worker and eventStore ([3e3b91e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3e3b91e))

### 💅 Refactors

- **StreamId:** Move StreamId to separate file ([b8432a5](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b8432a5))

#### ⚠️ Breaking Changes

- **global:** ⚠️  Updated repository, streamKey, outbox pattern+separated worker and eventStore ([3e3b91e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3e3b91e))

### ❤️ Contributors

- Jens van Hellemondt

## v2.5.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.4.1...v2.5.0)

### 🚀 Enhancements

- Add StreamId type ([dd9e4b1](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/dd9e4b1))

### 🏡 Chore

- Update deps ([0a6d9f1](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/0a6d9f1))

### ❤️ Contributors

- Jens van Hellemondt

## v2.4.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.4.0...v2.4.1)

### 💅 Refactors

- Move things around ([4a9cba3](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4a9cba3))
- Tidying ([ea25621](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/ea25621))

### ❤️ Contributors

- Jens van Hellemondt

## v2.4.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.3.1...v2.4.0)

### 🚀 Enhancements

- **EventStore:** Should only have unpublished entries in the outbox ([eacc6ce](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/eacc6ce))
- **EventStore:** Should acknowledge dispatch in the outbox ([b21041d](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b21041d))
- **EventStore:** Should do nothing if the entry is not in the outbox ([f9931a2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/f9931a2))
- **streamId:** MakeStreamId should format the right streamId ([95dab30](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/95dab30))
- **Repository:** Implement new EventStore ([0fa6fa2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/0fa6fa2))

### 💅 Refactors

- **EventStore:** Tidying test file ([38ec1e6](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/38ec1e6))
- Further integrate outbox pattern ([e41ad0e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e41ad0e))

### ❤️ Contributors

- Jens van Hellemondt

## v2.3.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.3.0...v2.3.1)

### 🏡 Chore

- Make scenario test generic ([a4e8396](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/a4e8396))

### ❤️ Contributors

- Jens van Hellemondt

## v2.3.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.2.1...v2.3.0)

### 🚀 Enhancements

- Database query spec argument is Partial<T> ([513df16](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/513df16))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v2.2.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.2.0...v2.2.1)

### 🏡 Chore

- Add build step to release ([2ae9ddb](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2ae9ddb))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v2.2.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.1.2...v2.2.0)

### 🚀 Enhancements

- **EventBus:** Subscribe to event type ([2cae252](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2cae252))
- **EventBus:** Subscribe to event type ([24c8c90](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/24c8c90))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v2.1.2

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.1.1...v2.1.2)

### 🏡 Chore

- Update package exports ([9c4ad7b](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9c4ad7b))

### ❤️ Contributors

- Jens van Hellemondt

## v2.1.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.1.0...v2.1.1)

### 🏡 Chore

- Update package exports ([254a20f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/254a20f))

### ❤️ Contributors

- Jens van Hellemondt

## v2.1.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.0.0...v2.1.0)

### 🚀 Enhancements

- Update user example test ([444d63f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/444d63f))
- Remove BaseEvent ([24ed2b2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/24ed2b2))
- Build step ([84d36fc](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/84d36fc))

### 🏡 Chore

- Prepare for build step ([acf5466](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/acf5466))
- Update tsconfig, eslint and fix accordingly ([1b47ee2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/1b47ee2))
- Build to esm/cjs ([3044a46](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/3044a46))

### ❤️ Contributors

- Jens van Hellemondt
- Jens Van Hellemondt <jens@invictus.codes>

## v2.0.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v2.0.0-0...v2.0.0)

### 🏡 Chore

- Make package public ([8cc0d84](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8cc0d84))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v2.0.0-0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.6.0...v2.0.0-0)

### 🚀 Enhancements

- Implement Decider interface ([1c0b8d9](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/1c0b8d9))
- Implement decider, update accordingly and reorganize folder structure ([dbb093f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/dbb093f))

### ❤️ Contributors

- Jens van Hellemondt

## v1.6.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.5.1...v1.6.0)

### 🚀 Enhancements

- Remove sequenceNumber from eventing ([34b10eb](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/34b10eb))
- Move event source and query/command kind to root ([4012091](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4012091))

### ❤️ Contributors

- Jens van Hellemondt

## v1.5.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.5.0...v1.5.1)

### 🤖 CI

- Fix pipeline ([5128f77](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/5128f77))
- Rename utils revert ([38a5a77](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/38a5a77))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.5.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.4.0...v1.5.0)

### 💅 Refactors

- Make everything based on interfaces instead of abstracts ([4f6c59a](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/4f6c59a))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.4.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.3.0...v1.4.0)

### 💅 Refactors

- **AggregateRoot:** All aggregate state goes through eventing (apply) ([07cfb54](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/07cfb54))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.3.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- **AggregateRoot:** Implement sequenceNumber ([1079fac](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/1079fac))

### 💅 Refactors

- QueryHandler argument should be named query ([bae29aa](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/bae29aa))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.2.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.1.0...v1.2.0)

### 🚀 Enhancements

- **Database:** Remove requirement of index string in DatabaseRecord ([d6be1a4](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/d6be1a4))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.1.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.0.1...v1.1.0)

### 🚀 Enhancements

- **DomainEvent:** IsDomainEvent allows unknown events ([b23793d](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b23793d))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.0.1

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v1.0.0...v1.0.1)

### 🏡 Chore

- Add utils to exports ([276b022](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/276b022))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v1.0.0

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.9...v1.0.0)

### 🚀 Enhancements

- DomainEvent plain object ([d94e038](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/d94e038))
- IntegrationEvent ([2742c25](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/2742c25))
- Introduce BaseEvent ([bd13f58](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/bd13f58))
- **CommandBus:** ICommand ([08b30b1](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/08b30b1))
- **EventBus:** UserActivated event ([961fce1](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/961fce1))
- **EventBus:** Integration event handling ([eff74be](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/eff74be))
- **CommandBus:** Convert to plain command instead of class ([c5bb1a8](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c5bb1a8))
- **QueryBus:** Add utils ([08a473f](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/08a473f))
- **QueryBus:** Convert to plain object Queries ([82dd847](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/82dd847))

### 💅 Refactors

- Rename DomainEvent to v1 ([1c39ad5](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/1c39ad5))
- Move createXEvent to utils ([fcedf2e](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/fcedf2e))
- Replace DomainEvent with object DomainEvent and IntegrationEvent ([62519b2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/62519b2))

### 🏡 Chore

- Remove unnecessary vitest imports ([25bc983](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/25bc983))
- Update deps ([b8413a2](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b8413a2))

### ✅ Tests

- **EventBus:** Add tests to isEvent util ([e0a0294](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/e0a0294))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.9

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.8...v0.0.9)

### 🩹 Fixes

- Match scenariotest on props and id ([c0bbf06](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c0bbf06))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.8

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.7...v0.0.8)

### 🏡 Chore

- Remove unused Notifier ([8ed462d](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/8ed462d))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.7

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.6...v0.0.7)

### 🏡 Chore

- Export event ([c2de03b](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/c2de03b))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.6

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.5...v0.0.6)

### 🚀 Enhancements

- Add Event ([0c544e5](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/0c544e5))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.5

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.4...v0.0.5)

### 🏡 Chore

- Add repository type ([282b78a](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/282b78a))
- Add vitest/globals to tsconfig ([fec28be](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/fec28be))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.4

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.3...v0.0.4)

### 💅 Refactors

- **AggregateRoot:** Move id to first argument ([6d70b9c](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/6d70b9c))

### 🤖 CI

- Add github action to verify latest changes ([b4f464b](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/b4f464b))
- Update release-it to use coverage ([d569101](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/d569101))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.3

[compare changes](https://github.com/jvhellemondt/arts-and-crafts.ts/compare/v0.0.2...v0.0.3)

### 🏡 Chore

- Rename package to arts-and-crafts ([9e9c56a](https://github.com/jvhellemondt/arts-and-crafts.ts/commit/9e9c56a))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.2


### 🚀 Enhancements

- **AggregateRoot:** Should be defined ([f41be10](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f41be10))
- **Entity:** Apply factory pattern ([953f6bd](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/953f6bd))
- **root:** Add a watch specific test mode ([bb428a0](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/bb428a0))
- **AggregateRoot:** Should apply events ([e6d146e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e6d146e))
- **AggregateRoot:** Should mark events as committed by clearing uncommittedEvents ([4a7b6b3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4a7b6b3))
- **Specification:** Add Specification and AndSpecification ([7f0d923](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7f0d923))
- **Specification:** Add OrSpecification ([f4d9660](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f4d9660))
- **Specification:** OrSpecification should/ should not satisfy ([b36c48f](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b36c48f))
- **Specificaton:** NotSpecification should be defined ([e78c142](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e78c142))
- **Specificaton:** NotSpecification should/ should not be satisfied ([c2a0e46](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c2a0e46))
- **Repository:** Should be defined and have a find, load and store method ([ed6df1c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ed6df1c))
- **Repository:** Should be able to store a new event from an aggregate ([c3ff9c7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c3ff9c7))
- **AggregateRoot:** Should rehydrate events ([16520b4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/16520b4))
- **AggregateRoot:** Should rehydrate events ([e7f38d1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e7f38d1))
- **Repository:** Should rehydrate the aggregate based on its events ([0ddac9d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/0ddac9d))
- **EventHandler:** Should be defined ([15b9c61](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/15b9c61))
- **QueryHandler:** Should process the MockUserCreated event and dispatch the MockUserRegistrationEmailSentEvent ([9851d95](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9851d95))
- **EventBus:** Should be able subscribe to events ([c1d24bd](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c1d24bd))
- **CommandHandler:** Should process the command and emit the UserCreated event ([7521ba1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7521ba1))
- **CommandHandler:** Should process the MockUpdateUserName Command and emit the MockUserNameUpdated Event ([4c1fb35](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4c1fb35))
- **ProjectionHandler:** Should be defined ([3f34fc5](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/3f34fc5))
- **Specification:** Add toQuery method ([ab27fcf](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ab27fcf))
- **QueryBus:** Update Query specification and add mock query handlers ([97c8cee](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/97c8cee))
- **ProjectionHandler:** Add ProjectionHandler interface and Database interface ([204c0fc](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/204c0fc))
- **Specification:** Should be defined ([6ec2b4a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/6ec2b4a))
- **Specification:** Should return the correct filter for lookups ([14d99ab](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/14d99ab))
- **Specification:** (AgeSpecification) should return the correct filter for lookups ([0a71fc4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/0a71fc4))
- **Specification:** Add toQuery to binary specifications ([e3b8a80](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e3b8a80))
- Add husky for precommit and -push ([586d34a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/586d34a))
- **QueryHandler:** Should be defined ([28b3962](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/28b3962))
- Add UnknownFunction type ([9fbda34](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9fbda34))
- Add MockUserByEmailSpecification and its tests ([926578e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/926578e))
- **database:** Add Database spec and implement InMemory ([4978fb7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4978fb7))
- **querybus:** Implement database spec ([db82957](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/db82957))
- **querybus:** Queryhandler should return the requested data ([15f2e6f](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/15f2e6f))
- **domainevent:** Split metadata to props and internal. Generate eventId and event timestamp ([8962c5a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8962c5a))
- **eventbus:** Should be able publish events ([21a2e4e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/21a2e4e))
- **QueryBus:** It should be defined ([1599113](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1599113))
- **QueryBus:** Should throw an error if the query handler is not registered ([c8ec1ef](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c8ec1ef))
- **QueryBus:** Should be able to register a handler ([4285822](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4285822))
- **QueryBus:** Should execute a query ([e0efcf7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e0efcf7))
- **Database:** Should return TableDoesNotExistException if the table does not exist ([1ca99c3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1ca99c3))
- **Database:** Should throw an error if the operation is not supported ([9a07e53](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9a07e53))
- **ProjectionHandler:** Should update projection with create event ([927d11a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/927d11a))
- **ProjectionHandler:** Should update projection with update event ([c095383](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c095383))
- **ScenarioTest:** Should add the events provided to the given step to the eventStore ([7c30c32](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7c30c32))
- **ScenarioTest:** Should execute the command in the when step ([30a45b2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/30a45b2))
- **ScenarioTest:** Should have executed the command, as an event, in the then step ([10c132e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/10c132e))
- **CommandBus:** Command should have a type ([ab2aa3c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ab2aa3c))
- **QueryBus:** Query should have a type ([1c12c95](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1c12c95))
- **EventBus:** Event should have a type ([be77518](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/be77518))
- **ScenarioTest:** Should have executed the query with the expected result in the then step ([53de265](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/53de265))
- **ValueObject:** Should be defined ([e616be2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e616be2))
- **ValueObject:** Should implement IValueObject ([b013e5c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b013e5c))
- **ValueObject:** Should equal based on hash if its value is equal (string) ([8cf411c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8cf411c))
- **ValueObject:** Should equal based on hash if its value is equal (others) ([f94d660](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f94d660))
- **ValueObject:** Should not equal based on hash if its value is not equal ([fbfc6da](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/fbfc6da))
- **ValueObject:** Should return the value given ([60f00a4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/60f00a4))
- **ScenarioTest:** Should throw an error when a command is given and then the expected event is not triggered ([d388722](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/d388722))
- **ScenarioTest:** Should have dispatched an event based on listening to an event ([43eabc6](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/43eabc6))
- **ScenarioTest:** Should throw an error if the when is an event and then is not an event ([554ee17](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/554ee17))

### 🩹 Fixes

- **CommandBus:** Add aggregateId to payload ([1e87826](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1e87826))
- **CommandBus:** Should process the command via commandBus and return the event ([a668560](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a668560))
- **MockUserCreatedEventHandler:** Only run on created event ([86d15e7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/86d15e7))
- **MockUserProjection:** Do not throw error on unknown events ([2d3f240](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/2d3f240))
- **ScenarioTest:** Find event by constructor name ([a8ce7eb](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a8ce7eb))

### 💅 Refactors

- **Entity:** Update typing ([084e30d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/084e30d))
- **AggregateRoot:** Cleanup test ([5261b67](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5261b67))
- **Repository:** Remove find method and separate the tests ([e8bd751](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e8bd751))
- **DomainEvent:** Redesign DomainEvent ([7a93450](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7a93450))
- **CommandBus:** Simplify types ([a83ca93](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a83ca93))
- **QueryBus:** Simplify types ([c713de1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c713de1))
- **Repository:** Simplify types ([a8f488e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a8f488e))
- **Entity:** Simplify types ([1bc31f2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1bc31f2))
- **Aggregate:** Simplify types ([c464df6](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c464df6))
- **ScenarioTest:** Simplify types ([23bfe5c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/23bfe5c))
- **DomainEvent:** Simplify types ([23f583a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/23f583a))
- **CommandBus:** Rename MockCommand to MockUpdateUserNameCommand ([a3c27b1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a3c27b1))
- **Repository:** Rename MockRepository to MockUserRepository ([fa2f066](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/fa2f066))
- **Specification:** Update the result type of toQuery method ([cdcf51e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/cdcf51e))
- **Specification:** Update typings toQuery method ([43f7826](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/43f7826))
- **Specification:** ToQuery should return an array ([5986074](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5986074))
- **EventBus:** Should subscribe event handlers without specific event ([26f7a30](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/26f7a30))
- **specification:** Update toQuery type to FilledArray ([af9f99a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/af9f99a))
- **EventStore:** Add eventBus to the eventStore ([9eddd81](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9eddd81))
- **InMemoryEventStore:** Only create empty array when aggregate was not in event store ([09037ee](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/09037ee))
- **ScenarioTest:** Should execute the givens and when-command in the then step ([8d13cc3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8d13cc3))
- **ScenarioTest:** Should execute the givens and when-command in the then step ([57ebe9b](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/57ebe9b))
- Move Module interface to separate file ([a611884](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a611884))
- Update generics for AggregateRoot and update consequently ([88912b6](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/88912b6))

### 🏡 Chore

- Migrate to submodule ([dd61150](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/dd61150))
- Remove unused index.ts ([5659907](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5659907))
- **types:** Improve typing and type inference ([a59109e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a59109e))
- **config:** Add commitlint and update husky ([b4af9f3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b4af9f3))
- Rename test:coverage to coverage ([f420997](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f420997))
- **ProjectionHandler:** Remove start from interface, prefer eventBus.subscribe ([a230d7d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a230d7d))
- **eslint:** Update eslint config to use antfu's and lint:fix ([d4a5aa4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/d4a5aa4))
- Rename mocks to examples ([851c6f7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/851c6f7))
- Add release flow ([50b09f0](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/50b09f0))
- **release:** V0.0.1 ([dd6e75b](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/dd6e75b))
- Update package name to -essentials ([6424d45](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/6424d45))
- **ScenarioTest:** Move tests to their action type ([00a338d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/00a338d))
- **ScenarioTest:** Remove falsy check at isEvent within ScenarioTest ([060ced7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/060ced7))
- **husky:** Enable coverage check ([a8fcf07](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a8fcf07))

### ✅ Tests

- **AggregateRoot:** Should do nothing on an unhandled event ([a1d710b](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a1d710b))
- **AggregateRoot:** Add tests for missing create/rehydrate methods ([f2fb2f5](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f2fb2f5))
- **ScenarioTest:** Add failure cases ([100f632](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/100f632))
- **ScenarioTest:** Should throw an error if the when is an event and then is not found ([54bb91d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/54bb91d))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>

## v0.0.1


### 🚀 Enhancements

- **AggregateRoot:** Should be defined ([f41be10](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f41be10))
- **Entity:** Apply factory pattern ([953f6bd](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/953f6bd))
- **root:** Add a watch specific test mode ([bb428a0](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/bb428a0))
- **AggregateRoot:** Should apply events ([e6d146e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e6d146e))
- **AggregateRoot:** Should mark events as committed by clearing uncommittedEvents ([4a7b6b3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4a7b6b3))
- **Specification:** Add Specification and AndSpecification ([7f0d923](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7f0d923))
- **Specification:** Add OrSpecification ([f4d9660](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f4d9660))
- **Specification:** OrSpecification should/ should not satisfy ([b36c48f](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b36c48f))
- **Specificaton:** NotSpecification should be defined ([e78c142](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e78c142))
- **Specificaton:** NotSpecification should/ should not be satisfied ([c2a0e46](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c2a0e46))
- **Repository:** Should be defined and have a find, load and store method ([ed6df1c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ed6df1c))
- **Repository:** Should be able to store a new event from an aggregate ([c3ff9c7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c3ff9c7))
- **AggregateRoot:** Should rehydrate events ([16520b4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/16520b4))
- **AggregateRoot:** Should rehydrate events ([e7f38d1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e7f38d1))
- **Repository:** Should rehydrate the aggregate based on its events ([0ddac9d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/0ddac9d))
- **EventHandler:** Should be defined ([15b9c61](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/15b9c61))
- **QueryHandler:** Should process the MockUserCreated event and dispatch the MockUserRegistrationEmailSentEvent ([9851d95](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9851d95))
- **EventBus:** Should be able subscribe to events ([c1d24bd](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c1d24bd))
- **CommandHandler:** Should process the command and emit the UserCreated event ([7521ba1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7521ba1))
- **CommandHandler:** Should process the MockUpdateUserName Command and emit the MockUserNameUpdated Event ([4c1fb35](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4c1fb35))
- **ProjectionHandler:** Should be defined ([3f34fc5](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/3f34fc5))
- **Specification:** Add toQuery method ([ab27fcf](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ab27fcf))
- **QueryBus:** Update Query specification and add mock query handlers ([97c8cee](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/97c8cee))
- **ProjectionHandler:** Add ProjectionHandler interface and Database interface ([204c0fc](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/204c0fc))
- **Specification:** Should be defined ([6ec2b4a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/6ec2b4a))
- **Specification:** Should return the correct filter for lookups ([14d99ab](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/14d99ab))
- **Specification:** (AgeSpecification) should return the correct filter for lookups ([0a71fc4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/0a71fc4))
- **Specification:** Add toQuery to binary specifications ([e3b8a80](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e3b8a80))
- Add husky for precommit and -push ([586d34a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/586d34a))
- **QueryHandler:** Should be defined ([28b3962](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/28b3962))
- Add UnknownFunction type ([9fbda34](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9fbda34))
- Add MockUserByEmailSpecification and its tests ([926578e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/926578e))
- **database:** Add Database spec and implement InMemory ([4978fb7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4978fb7))
- **querybus:** Implement database spec ([db82957](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/db82957))
- **querybus:** Queryhandler should return the requested data ([15f2e6f](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/15f2e6f))
- **domainevent:** Split metadata to props and internal. Generate eventId and event timestamp ([8962c5a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8962c5a))
- **eventbus:** Should be able publish events ([21a2e4e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/21a2e4e))
- **QueryBus:** It should be defined ([1599113](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1599113))
- **QueryBus:** Should throw an error if the query handler is not registered ([c8ec1ef](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c8ec1ef))
- **QueryBus:** Should be able to register a handler ([4285822](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/4285822))
- **QueryBus:** Should execute a query ([e0efcf7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e0efcf7))
- **Database:** Should return TableDoesNotExistException if the table does not exist ([1ca99c3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1ca99c3))
- **Database:** Should throw an error if the operation is not supported ([9a07e53](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9a07e53))
- **ProjectionHandler:** Should update projection with create event ([927d11a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/927d11a))
- **ProjectionHandler:** Should update projection with update event ([c095383](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c095383))
- **ScenarioTest:** Should add the events provided to the given step to the eventStore ([7c30c32](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7c30c32))
- **ScenarioTest:** Should execute the command in the when step ([30a45b2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/30a45b2))
- **ScenarioTest:** Should have executed the command, as an event, in the then step ([10c132e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/10c132e))
- **CommandBus:** Command should have a type ([ab2aa3c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/ab2aa3c))
- **QueryBus:** Query should have a type ([1c12c95](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1c12c95))
- **EventBus:** Event should have a type ([be77518](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/be77518))
- **ScenarioTest:** Should have executed the query with the expected result in the then step ([53de265](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/53de265))
- **ValueObject:** Should be defined ([e616be2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e616be2))
- **ValueObject:** Should implement IValueObject ([b013e5c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b013e5c))
- **ValueObject:** Should equal based on hash if its value is equal (string) ([8cf411c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8cf411c))
- **ValueObject:** Should equal based on hash if its value is equal (others) ([f94d660](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f94d660))
- **ValueObject:** Should not equal based on hash if its value is not equal ([fbfc6da](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/fbfc6da))
- **ValueObject:** Should return the value given ([60f00a4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/60f00a4))

### 🩹 Fixes

- **CommandBus:** Add aggregateId to payload ([1e87826](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1e87826))
- **CommandBus:** Should process the command via commandBus and return the event ([a668560](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a668560))
- **MockUserCreatedEventHandler:** Only run on created event ([86d15e7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/86d15e7))
- **MockUserProjection:** Do not throw error on unknown events ([2d3f240](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/2d3f240))

### 💅 Refactors

- **Entity:** Update typing ([084e30d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/084e30d))
- **AggregateRoot:** Cleanup test ([5261b67](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5261b67))
- **Repository:** Remove find method and separate the tests ([e8bd751](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/e8bd751))
- **DomainEvent:** Redesign DomainEvent ([7a93450](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/7a93450))
- **CommandBus:** Simplify types ([a83ca93](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a83ca93))
- **QueryBus:** Simplify types ([c713de1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c713de1))
- **Repository:** Simplify types ([a8f488e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a8f488e))
- **Entity:** Simplify types ([1bc31f2](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/1bc31f2))
- **Aggregate:** Simplify types ([c464df6](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/c464df6))
- **ScenarioTest:** Simplify types ([23bfe5c](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/23bfe5c))
- **DomainEvent:** Simplify types ([23f583a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/23f583a))
- **CommandBus:** Rename MockCommand to MockUpdateUserNameCommand ([a3c27b1](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a3c27b1))
- **Repository:** Rename MockRepository to MockUserRepository ([fa2f066](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/fa2f066))
- **Specification:** Update the result type of toQuery method ([cdcf51e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/cdcf51e))
- **Specification:** Update typings toQuery method ([43f7826](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/43f7826))
- **Specification:** ToQuery should return an array ([5986074](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5986074))
- **EventBus:** Should subscribe event handlers without specific event ([26f7a30](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/26f7a30))
- **specification:** Update toQuery type to FilledArray ([af9f99a](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/af9f99a))
- **EventStore:** Add eventBus to the eventStore ([9eddd81](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/9eddd81))
- **InMemoryEventStore:** Only create empty array when aggregate was not in event store ([09037ee](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/09037ee))
- **ScenarioTest:** Should execute the givens and when-command in the then step ([8d13cc3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/8d13cc3))
- **ScenarioTest:** Should execute the givens and when-command in the then step ([57ebe9b](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/57ebe9b))

### 🏡 Chore

- Migrate to submodule ([dd61150](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/dd61150))
- Remove unused index.ts ([5659907](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/5659907))
- **types:** Improve typing and type inference ([a59109e](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a59109e))
- **config:** Add commitlint and update husky ([b4af9f3](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/b4af9f3))
- Rename test:coverage to coverage ([f420997](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/f420997))
- **ProjectionHandler:** Remove start from interface, prefer eventBus.subscribe ([a230d7d](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a230d7d))
- **eslint:** Update eslint config to use antfu's and lint:fix ([d4a5aa4](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/d4a5aa4))
- Rename mocks to examples ([851c6f7](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/851c6f7))
- Add release flow ([50b09f0](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/50b09f0))

### ✅ Tests

- **AggregateRoot:** Should do nothing on an unhandled event ([a1d710b](https://github.com/jvhellemondt/crafts-and-arts.ts/commit/a1d710b))

### ❤️ Contributors

- Jens Van Hellemondt <jens@invictus.codes>
