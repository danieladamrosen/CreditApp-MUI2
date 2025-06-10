# Credit Repair Dashboard

A cutting-edge AI-powered credit repair dashboard that transforms financial health tracking through intelligent, personalized insights and advanced data analysis.

## Features

- **Advanced Credit Report Parsing**: Intelligent parsing of credit reports from all three major bureaus
- **AI-Powered Dispute Generation**: Automated dispute letter generation with Metro 2 compliance violations
- **Modern Responsive UI**: Clean, professional interface optimized for both desktop and mobile
- **Real-time Credit Analysis**: Comprehensive analysis of credit accounts, inquiries, and personal information
- **Intelligent Auto-Population**: Smart form filling with context-aware dispute reasons and instructions

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Material-UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Deployment**: Optimized for production with health checks

## Recent Updates (June 8, 2025)

### Fixed Issues
- ✅ Port conflict resolution between development (3000) and production (5000) servers
- ✅ "Select All Previous Addresses" button now correctly filters only address fields
- ✅ Auto-scrolling functionality restored for address selection
- ✅ Improved server stability with dedicated development server configuration

### Enhanced Features
- 🔧 Separate development server (`server/dev-server.ts`) for improved debugging
- 🔧 Production-ready deployment configuration with health checks
- 🔧 Optimized build process for faster deployments
- 🔧 Enhanced error handling and logging

## Project Structure

```
├── client/                           # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── credit-report/       # Credit report specific components
│   │   │   │   ├── modern-personal-info.tsx    # Fixed address selection
│   │   │   │   ├── modern-inquiries.tsx
│   │   │   │   └── modern-accounts.tsx
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   └── layout/              # Layout components
│   │   ├── pages/                   # Application pages
│   │   ├── utils/                   # Utility functions
│   │   └── hooks/                   # Custom React hooks
│   └── public/                      # Static assets
├── server/                          # Backend Node.js application
│   ├── index.ts                     # Main production server
│   ├── dev-server.ts               # Development server (new)
│   ├── deploy.ts                    # Deployment server
│   ├── routes.ts                    # API routes
│   ├── storage.ts                   # Database operations
│   └── db.ts                        # Database configuration
├── shared/                          # Shared types and schemas
│   ├── schema.ts                    # Database schema
│   └── types.ts                     # TypeScript types
└── dist/                           # Production build output
```

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- GitHub token for backup operations

### Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
DATABASE_URL=your_postgresql_url
GITHUB_TOKEN=your_github_token
```

### Running the Application

#### Development Mode
```bash
npm run dev
# Runs on http://localhost:3000
```

#### Production Mode
```bash
npm run build
npm start
# Runs on http://localhost:5000
```

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm start` - Start production server on port 5000
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## API Endpoints

### Health Checks
- `GET /health` - Application health status
- `GET /api/health` - API health status

### Credit Report Processing
- `POST /api/ai-scan` - AI-powered credit report analysis
- `GET /api/templates/reason/:category` - Dispute reason templates
- `GET /api/templates/instruction/:category` - Dispute instruction templates

## Database Schema

The application uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Credit Reports**: Parsed credit report data storage
- **Disputes**: Generated dispute information
- **Templates**: Reusable dispute templates
- **User Sessions**: Session management

## Deployment

The application is optimized for deployment with:

- **Health Check Endpoints**: For load balancer monitoring
- **Optimized Build Process**: Efficient asset bundling
- **Static File Serving**: Cached asset delivery
- **Error Handling**: Comprehensive error logging

### Production Build Features
- Code splitting for optimal loading
- Compressed assets for faster delivery
- Environment-specific configurations
- Automated health monitoring

## AI Features

### Credit Report Analysis
- Automatic identification of negative accounts
- Metro 2 compliance violation detection
- Intelligent dispute reason generation
- Context-aware instruction creation

### Smart Form Population
- Auto-population based on selected items
- Typewriter effect for user engagement
- Intelligent field validation
- Real-time form completion feedback

## Mobile Optimization

- Responsive design for all screen sizes
- Touch-optimized interfaces
- Mobile-specific navigation
- Optimized performance for mobile devices

## Security Features

- FCRA and FDCPA compliance standards
- Secure data handling practices
- Input validation and sanitization
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For technical support or questions, please contact the development team.

---

**Last Updated**: June 8, 2025  
**Version**: 2.1.0  
**Status**: Production Ready