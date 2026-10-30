# AI crawling policy and enforcement

`public/robots.txt` requests no crawling by named AI training crawlers, AI search crawlers, and user-triggered AI fetchers. Ordinary Google, Bing, DuckDuckGo and Yahoo indexing remains allowed. The policy includes current Anthropic names, OpenAI's separate training/search/user agents, Meta's AI agents, and other identified AI crawlers. Tests check the intent of these groups and confirm the file is included in build output.

## What the live site currently does

On 30 October 2026, `https://minimallyphotos.com/robots.txt` included Cloudflare-managed content before the repository's rules. That managed section explicitly had `ai-train=no` and `use=reference`, along with training-crawler disallow groups. This confirms managed robots content is active; it does not prove that every AI access category is blocked.

A public request labelled `GPTBot` received HTTP 200. This is only a user-agent probe from an ordinary client, not traffic from OpenAI's verified bot infrastructure, so it cannot establish the state of Cloudflare's verified-bot policies. Account-level settings and security logs have not been inspected or changed.

## What is needed for enforcement

Configure the domain's [Cloudflare AI bot policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) or [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/) to block the intended categories. For the broad policy expressed here, review Training, AI Search, and Agent access; training-only blocking does not cover the other two. Use analytics/security events to confirm real classified crawlers are denied. These settings are separate from Cloudflare-managed robots content and from this repository's static files.

`robots.txt` is advisory. In particular, [OpenAI documents that user-initiated ChatGPT-User requests may not follow these rules](https://developers.openai.com/api/docs/bots). A bot can also misidentify itself. Neither static directives nor user-agent checks can guarantee that publicly readable pages are inaccessible to all AI systems.

The scope is this site's host. Public images on `res.cloudinary.com`, public content in the GitHub repository, and any other public deployment hosts need their own controls. This domain's robots rules and Cloudflare zone policies do not automatically protect those copies.

Allowing ordinary search indexing also retains some AI exposure: [Google uses Googlebot and Search preview controls for AI Overviews/AI Mode](https://developers.google.com/search/docs/appearance/ai-features), while Google-Extended controls other training/grounding uses. Changing Search snippet/indexing controls would affect ordinary search presentation and is not included in this change.

## After deployment

Check the served `/robots.txt` on each public site host, including Cloudflare's prepended managed section, and verify the updated current bot names are present. Confirm the desired blocking categories in Cloudflare and review actual security events. Continue updating the named-agent list using [Cloudflare's bot reference](https://developers.cloudflare.com/ai-crawl-control/reference/bots/) and provider documentation as crawler identities change.
