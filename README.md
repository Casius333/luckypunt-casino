# Lucky Punt

A Next.js application with Supabase integration.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- ESLint

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3333
```

2. Replace the placeholder values with your actual Supabase credentials.

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3333](http://localhost:3333) in your browser.

## Deployment to DigitalOcean

1. Create a new DigitalOcean Droplet or App Platform project.

2. Set up environment variables in your DigitalOcean dashboard:
   - Add all variables from `.env.local`
   - Set `NEXT_PUBLIC_SITE_URL` to your production domain

3. Deploy using one of these methods:
   - GitHub Actions (recommended)
   - Direct deployment via DigitalOcean App Platform
   - Manual deployment to a Droplet

### Production Build

```bash
npm run build
npm start
```

## Security Considerations

- Never commit `.env.local` to version control
- Keep your Supabase service role key secure
- Regularly rotate your API keys
- Use environment variables for all sensitive data

## License

[MIT](https://choosealicense.com/licenses/mit/)
