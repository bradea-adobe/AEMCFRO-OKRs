# AEM Cloud Foundation RO - OKRs Tracker

A web-based dashboard application for tracking Objectives and Key Results (OKRs) for the AEM Cloud Foundation Release Operations team.

## Features

- **Dashboard View**: Visualize all OKRs with color-coded status indicators and trend analysis
- **Monthly Tracker**: Update actual values and comments for Key Results
- **Admin Panel**: Manage objectives, key results, and monthly targets
- **Local Storage**: All data persists in browser using IndexedDB (no backend required)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Export/Import**: Backup and restore data via JSON export

## Technology Stack

- **Frontend**: React 18 + TypeScript (strict mode)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: Headless UI (accessible components)
- **Database**: sql.js (SQLite in browser with IndexedDB persistence)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 20+ 
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AEMCFRO-OKRs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   - Copy `.env.example` to `.env`
   - Adjust `VITE_START_DATE` and `VITE_END_DATE` if needed
   - Default: October 2025 - December 2026

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
AEMCFRO-OKRs/
├── src/
│   ├── components/       # React components
│   │   ├── Dashboard/    # Dashboard view components
│   │   ├── Admin/        # Admin panel components
│   │   ├── Tracker/      # Monthly tracker components
│   │   ├── shared/       # Reusable UI components
│   │   └── layout/       # Layout components (nav, header)
│   ├── lib/              # Core business logic
│   │   ├── database.ts   # sql.js wrapper & IndexedDB
│   │   ├── queries.ts    # SQL CRUD operations
│   │   ├── calculations.ts  # Status/trend logic
│   │   ├── validation.ts # Zod schemas
│   │   └── utils.ts      # Helper functions
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React Context providers
│   ├── types/            # TypeScript type definitions
│   └── tests/            # Test files
├── public/               # Static assets
├── REQUIREMENTS.md       # Complete requirements specification
├── IMPLEMENTATION_PLAN.md # Detailed implementation plan
└── package.json          # Dependencies and scripts
```

## Usage

### 1. Admin Page
- Create and manage Objectives
- Add Key Results to Objectives
- Set monthly targets for each Key Result
- Edit or delete existing OKRs

### 2. Tracker Page
- Select a month from the dropdown
- Update actual values for Key Results
- Add monthly comments for Objectives
- Data saves automatically to browser storage

### 3. Dashboard
- View all OKRs at a glance
- See status indicators:
  - 🟢 **Green**: >= 75% of target (On Track)
  - 🟠 **Orange**: 50-74% of target (Under-Watch)
  - 🔴 **Red**: < 50% of target (Off Track)
- Track month-over-month trends (↑↓→ with percentages)
- Filter by status or owner

## Data Storage

- All data is stored **locally in your browser** using IndexedDB
- No backend server or external database required
- Data persists across browser sessions
- **Important**: Clearing browser data will delete all OKRs
  - Use Export functionality regularly for backups

## Browser Support

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## Timeline Configuration

The OKR tracking period is configurable via environment variables:

```env
VITE_START_DATE=2025-10  # October 2025
VITE_END_DATE=2026-12    # December 2026
```

When the end date is reached:
- Dashboard remains fully functional (historical view)
- Tracker becomes read-only
- Admin shows instructions to extend timeline

## Export/Import

### Export Data (Backup)
1. Go to Admin page
2. Click "Export Data"
3. Save the JSON file to a safe location

### Import Data (Restore)
1. Go to Admin page
2. Click "Import Data"
3. Select your backup JSON file
4. Confirm the import (this will replace existing data)

## Development Notes

### Adding New Features

Follow the workflow defined in `.cursorrules`:
1. Update `REQUIREMENTS.md` with new FR/NFR IDs
2. Run `python3 tools/gen_plan.py` to update the plan
3. Write tests first (TDD approach)
4. Implement the feature
5. Update documentation

### Code Quality Standards

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Zod for runtime validation
- 90%+ test coverage for business logic

## Troubleshooting

### Database not loading
- Clear browser cache and reload
- Check browser console for errors
- Ensure cookies/storage are enabled

### Data loss
- Browser data clearing will delete OKRs
- **Solution**: Export data regularly as backup

### Storage quota exceeded
- Warning appears at 80% capacity
- Export and archive old data
- Consider browser storage limits (typically 5-50MB)

## Contributing

1. Follow the coding standards in `.cursorrules`
2. Write tests for new features
3. Run `npm run lint` and `npm test` before committing
4. Update documentation as needed

## License

Internal use only - AEM Cloud Foundation Release Operations team

## Support

For questions or issues, contact the development team.

---

**Last Updated**: November 24, 2025  
**Version**: 1.0.0  
**Status**: Phase 1 MVP Complete ✅

