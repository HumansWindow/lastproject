# Diary System Frontend Implementation

This document provides a comprehensive guide for implementing the frontend components of the diary system.

## Component Structure

### Page Components

1. **DiaryHomePage**: Main entry point for the diary feature
2. **DiaryEntryListPage**: Displays a paginated list of diary entries
3. **DiaryEntryDetailPage**: Shows a single diary entry with full content
4. **DiaryEntryFormPage**: Form for creating and editing diary entries
5. **DiarySettingsPage**: User preferences and reminder settings
6. **DiaryStatsPage**: Analytics and statistics about diary usage

### UI Components

1. **DiaryEntryCard**: Card component for displaying entry preview in lists
2. **DiaryEntryEditor**: Rich text editor for diary entry content
3. **DiaryMediaUploader**: Component for uploading and previewing images
4. **DiaryTagSelector**: Component for managing tags on entries
5. **DiaryMoodSelector**: UI for selecting mood/emotion for entries
6. **DiaryCalendarView**: Calendar view showing entries by date
7. **DiaryFilterBar**: Filter controls for searching and filtering entries
8. **DiaryReminderForm**: Form for configuring diary reminders
9. **DiaryStreakDisplay**: Component showing the user's current streak
10. **DiaryPrivacySelector**: Controls for setting entry privacy level

## State Management

The diary feature will use a combination of React Context and Redux (or equivalent state management) to handle state:

```typescript
// src/features/diary/diarySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DiaryEntry, DiaryReminder, DiaryStats } from './types';
import { diaryApi } from '../../services/diaryApi';

interface DiaryState {
  entries: DiaryEntry[];
  currentEntry: DiaryEntry | null;
  reminders: DiaryReminder[];
  stats: DiaryStats | null;
  filters: {
    searchTerm: string;
    tags: string[];
    startDate: string | null;
    endDate: string | null;
    privacyLevel: string | null;
    mood: string | null;
  };
  loading: {
    entries: boolean;
    currentEntry: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    reminders: boolean;
    stats: boolean;
  };
  error: {
    entries: string | null;
    currentEntry: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    reminders: string | null;
    stats: string | null;
  };
}

const initialState: DiaryState = {
  entries: [],
  currentEntry: null,
  reminders: [],
  stats: null,
  filters: {
    searchTerm: '',
    tags: [],
    startDate: null,
    endDate: null,
    privacyLevel: null,
    mood: null,
  },
  loading: {
    entries: false,
    currentEntry: false,
    create: false,
    update: false,
    delete: false,
    reminders: false,
    stats: false,
  },
  error: {
    entries: null,
    currentEntry: null,
    create: null,
    update: null,
    delete: null,
    reminders: null,
    stats: null,
  },
};

// Async thunks
export const fetchEntries = createAsyncThunk(
  'diary/fetchEntries',
  async (filters: Partial<DiaryState['filters']>, { rejectWithValue }) => {
    try {
      const response = await diaryApi.getEntries(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch diary entries');
    }
  }
);

export const fetchEntryById = createAsyncThunk(
  'diary/fetchEntryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await diaryApi.getEntryById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch diary entry');
    }
  }
);

export const createEntry = createAsyncThunk(
  'diary/createEntry',
  async (entry: Partial<DiaryEntry>, { rejectWithValue }) => {
    try {
      const response = await diaryApi.createEntry(entry);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to create diary entry');
    }
  }
);

export const updateEntry = createAsyncThunk(
  'diary/updateEntry',
  async ({ id, entry }: { id: string; entry: Partial<DiaryEntry> }, { rejectWithValue }) => {
    try {
      const response = await diaryApi.updateEntry(id, entry);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to update diary entry');
    }
  }
);

export const deleteEntry = createAsyncThunk(
  'diary/deleteEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await diaryApi.deleteEntry(id);
      return id;
    } catch (error) {
      return rejectWithValue('Failed to delete diary entry');
    }
  }
);

export const fetchReminders = createAsyncThunk(
  'diary/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await diaryApi.getReminders();
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch reminders');
    }
  }
);

export const setReminder = createAsyncThunk(
  'diary/setReminder',
  async (reminder: Partial<DiaryReminder>, { rejectWithValue }) => {
    try {
      const response = await diaryApi.setReminder(reminder);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to set reminder');
    }
  }
);

export const fetchStats = createAsyncThunk(
  'diary/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await diaryApi.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch diary statistics');
    }
  }
);

const diarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<DiaryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetCurrentEntry: (state) => {
      state.currentEntry = null;
    },
  },
  extraReducers: (builder) => {
    // Handle fetch entries
    builder.addCase(fetchEntries.pending, (state) => {
      state.loading.entries = true;
      state.error.entries = null;
    });
    builder.addCase(fetchEntries.fulfilled, (state, action) => {
      state.loading.entries = false;
      state.entries = action.payload;
    });
    builder.addCase(fetchEntries.rejected, (state, action) => {
      state.loading.entries = false;
      state.error.entries = action.payload as string;
    });

    // Handle fetch entry by id
    builder.addCase(fetchEntryById.pending, (state) => {
      state.loading.currentEntry = true;
      state.error.currentEntry = null;
    });
    builder.addCase(fetchEntryById.fulfilled, (state, action) => {
      state.loading.currentEntry = false;
      state.currentEntry = action.payload;
    });
    builder.addCase(fetchEntryById.rejected, (state, action) => {
      state.loading.currentEntry = false;
      state.error.currentEntry = action.payload as string;
    });

    // Handle create entry
    builder.addCase(createEntry.pending, (state) => {
      state.loading.create = true;
      state.error.create = null;
    });
    builder.addCase(createEntry.fulfilled, (state, action) => {
      state.loading.create = false;
      state.entries = [action.payload, ...state.entries];
      state.currentEntry = action.payload;
    });
    builder.addCase(createEntry.rejected, (state, action) => {
      state.loading.create = false;
      state.error.create = action.payload as string;
    });

    // Handle update entry
    builder.addCase(updateEntry.pending, (state) => {
      state.loading.update = true;
      state.error.update = null;
    });
    builder.addCase(updateEntry.fulfilled, (state, action) => {
      state.loading.update = false;
      state.currentEntry = action.payload;
      state.entries = state.entries.map(entry =>
        entry.id === action.payload.id ? action.payload : entry
      );
    });
    builder.addCase(updateEntry.rejected, (state, action) => {
      state.loading.update = false;
      state.error.update = action.payload as string;
    });

    // Handle delete entry
    builder.addCase(deleteEntry.pending, (state) => {
      state.loading.delete = true;
      state.error.delete = null;
    });
    builder.addCase(deleteEntry.fulfilled, (state, action) => {
      state.loading.delete = false;
      state.entries = state.entries.filter(entry => entry.id !== action.payload);
      if (state.currentEntry?.id === action.payload) {
        state.currentEntry = null;
      }
    });
    builder.addCase(deleteEntry.rejected, (state, action) => {
      state.loading.delete = false;
      state.error.delete = action.payload as string;
    });

    // Handle fetch reminders
    builder.addCase(fetchReminders.pending, (state) => {
      state.loading.reminders = true;
      state.error.reminders = null;
    });
    builder.addCase(fetchReminders.fulfilled, (state, action) => {
      state.loading.reminders = false;
      state.reminders = action.payload;
    });
    builder.addCase(fetchReminders.rejected, (state, action) => {
      state.loading.reminders = false;
      state.error.reminders = action.payload as string;
    });

    // Handle set reminder
    builder.addCase(setReminder.fulfilled, (state, action) => {
      state.reminders = [...state.reminders, action.payload];
    });

    // Handle fetch stats
    builder.addCase(fetchStats.pending, (state) => {
      state.loading.stats = true;
      state.error.stats = null;
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      state.loading.stats = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      state.loading.stats = false;
      state.error.stats = action.payload as string;
    });
  },
});

export const { setFilters, clearFilters, resetCurrentEntry } = diarySlice.actions;
export default diarySlice.reducer;
```

## API Service

```typescript
// src/services/diaryApi.ts
import axios from 'axios';
import { DiaryEntry, DiaryReminder } from '../features/diary/types';

const API_BASE_URL = '/api/diary';

export const diaryApi = {
  getEntries: (filters = {}) => {
    return axios.get(`${API_BASE_URL}/entries`, { params: filters });
  },
  
  getEntryById: (id: string) => {
    return axios.get(`${API_BASE_URL}/entries/${id}`);
  },
  
  createEntry: (entry: Partial<DiaryEntry>) => {
    return axios.post(`${API_BASE_URL}/entries`, entry);
  },
  
  updateEntry: (id: string, entry: Partial<DiaryEntry>) => {
    return axios.put(`${API_BASE_URL}/entries/${id}`, entry);
  },
  
  deleteEntry: (id: string) => {
    return axios.delete(`${API_BASE_URL}/entries/${id}`);
  },
  
  getReminders: () => {
    return axios.get(`${API_BASE_URL}/reminders`);
  },
  
  setReminder: (reminder: Partial<DiaryReminder>) => {
    return axios.post(`${API_BASE_URL}/reminders`, reminder);
  },
  
  toggleReminder: (id: string, isActive: boolean) => {
    return axios.put(`${API_BASE_URL}/reminders/${id}/toggle`, { isActive });
  },
  
  deleteReminder: (id: string) => {
    return axios.delete(`${API_BASE_URL}/reminders/${id}`);
  },
  
  getStats: () => {
    return axios.get(`${API_BASE_URL}/stats`);
  },
};
```

## Type Definitions

```typescript
// src/features/diary/types.ts
export enum DiaryPrivacyLevel {
  PRIVATE = 'private',
  FRIENDS = 'friends',
  PUBLIC = 'public',
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  tags?: string[];
  privacyLevel: DiaryPrivacyLevel;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  mood?: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

export interface DiaryReminder {
  id: string;
  userId: string;
  reminderTime: string;
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStats {
  totalEntries: number;
  entriesThisMonth: number;
  currentStreak: number;
  moodDistribution: {
    mood: string;
    count: number;
  }[];
}
```

## Diary Entry Card Component

```typescript
// src/features/diary/components/DiaryEntryCard.tsx
import React from 'react';
import { DiaryEntry } from '../types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardActions, IconButton, Typography, Chip, Box } from '@mui/material';
import { Delete, Edit, Visibility, Lock, Public, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteEntry } from '../diarySlice';
import { DiaryPrivacyLevel } from '../types';

interface DiaryEntryCardProps {
  entry: DiaryEntry;
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({ entry }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const handleView = () => {
    navigate(`/diary/entries/${entry.id}`);
  };
  
  const handleEdit = () => {
    navigate(`/diary/entries/${entry.id}/edit`);
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this diary entry?')) {
      dispatch(deleteEntry(entry.id));
    }
  };
  
  const getPrivacyIcon = () => {
    switch (entry.privacyLevel) {
      case DiaryPrivacyLevel.PRIVATE:
        return <Lock fontSize="small" />;
      case DiaryPrivacyLevel.FRIENDS:
        return <People fontSize="small" />;
      case DiaryPrivacyLevel.PUBLIC:
        return <Public fontSize="small" />;
      default:
        return <Lock fontSize="small" />;
    }
  };
  
  const renderTags = () => {
    if (!entry.tags || entry.tags.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {entry.tags.map(tag => (
          <Chip 
            key={tag} 
            label={tag} 
            size="small" 
            variant="outlined"
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Box>
    );
  };
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={entry.title}
        subheader={`${format(new Date(entry.createdAt), 'PPP')} • ${entry.mood || 'No mood'}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getPrivacyIcon()}
          </Box>
        }
      />
      <CardContent>
        <Typography variant="body1" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {/* Strip HTML tags for preview */}
          {entry.content.replace(/<[^>]*>?/gm, '').substring(0, 200)}
          {entry.content.length > 200 ? '...' : ''}
        </Typography>
        {renderTags()}
      </CardContent>
      <CardActions disableSpacing>
        <IconButton onClick={handleView} aria-label="view">
          <Visibility />
        </IconButton>
        <IconButton onClick={handleEdit} aria-label="edit">
          <Edit />
        </IconButton>
        <IconButton onClick={handleDelete} aria-label="delete">
          <Delete />
        </IconButton>
      </CardActions>
    </Card>
  );
};
```

## Diary Entry Form Component

```typescript
// src/features/diary/components/DiaryEntryForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createEntry, updateEntry, fetchEntryById, resetCurrentEntry } from '../diarySlice';
import { DiaryPrivacyLevel } from '../types';
import { RootState } from '../../store';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Grid,
  Paper,
  Typography,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { RichTextEditor } from './RichTextEditor';
import { DiaryMediaUploader } from './DiaryMediaUploader';
import { DiaryTagSelector } from './DiaryTagSelector';
import { DiaryMoodSelector } from './DiaryMoodSelector';
import { DiaryPrivacySelector } from './DiaryPrivacySelector';

export const DiaryEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentEntry, loading, error } = useSelector((state: RootState) => ({
    currentEntry: state.diary.currentEntry,
    loading: {
      currentEntry: state.diary.loading.currentEntry,
      create: state.diary.loading.create,
      update: state.diary.loading.update,
    },
    error: {
      currentEntry: state.diary.error.currentEntry,
      create: state.diary.error.create,
      update: state.diary.error.update,
    },
  }));
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<DiaryPrivacyLevel>(DiaryPrivacyLevel.PRIVATE);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  
  const [formErrors, setFormErrors] = useState({
    title: '',
    content: '',
  });
  
  const isEditMode = Boolean(id);
  
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchEntryById(id));
    } else {
      dispatch(resetCurrentEntry());
    }
    
    return () => {
      dispatch(resetCurrentEntry());
    };
  }, [dispatch, id, isEditMode]);
  
  useEffect(() => {
    if (currentEntry && isEditMode) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setMediaUrls(currentEntry.mediaUrls || []);
      setTags(currentEntry.tags || []);
      setMood(currentEntry.mood || '');
      setPrivacyLevel(currentEntry.privacyLevel);
      setLocation(currentEntry.location || null);
    }
  }, [currentEntry, isEditMode]);
  
  const validateForm = () => {
    const errors = {
      title: '',
      content: '',
    };
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!content.trim()) {
      errors.content = 'Content is required';
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const entryData = {
      title,
      content,
      mediaUrls,
      tags,
      mood: mood || undefined,
      privacyLevel,
      location: location || undefined,
    };
    
    if (isEditMode && id) {
      await dispatch(updateEntry({ id, entry: entryData }));
    } else {
      await dispatch(createEntry(entryData));
    }
    
    navigate('/diary/entries');
  };
  
  const handleMediaUpload = (urls: string[]) => {
    setMediaUrls([...mediaUrls, ...urls]);
  };
  
  const handleRemoveMedia = (url: string) => {
    setMediaUrls(mediaUrls.filter(mediaUrl => mediaUrl !== url));
  };
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Here you would typically use a reverse geocoding service
          // to get the location name based on coordinates
          // For now, we'll just use the coordinates as the name
          setLocation({
            latitude,
            longitude,
            name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };
  
  const handleRemoveLocation = () => {
    setLocation(null);
  };
  
  if (loading.currentEntry && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error.currentEntry && isEditMode) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography color="error" variant="h6">
          Error loading diary entry: {error.currentEntry}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/diary/entries')} sx={{ mt: 2 }}>
          Back to Diary Entries
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Edit Diary Entry' : 'Create Diary Entry'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Content
            </Typography>
            <RichTextEditor
              value={content}
              onChange={setContent}
              error={!!formErrors.content}
              helperText={formErrors.content}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DiaryMediaUploader
              existingMedia={mediaUrls}
              onUpload={handleMediaUpload}
              onRemove={handleRemoveMedia}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DiaryTagSelector 
              selectedTags={tags} 
              onChange={setTags} 
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DiaryMoodSelector 
              selectedMood={mood} 
              onChange={setMood} 
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DiaryPrivacySelector 
              selectedPrivacy={privacyLevel} 
              onChange={setPrivacyLevel} 
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Location
              </Typography>
              
              {location ? (
                <Box>
                  <Typography variant="body2">{location.name}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={handleRemoveLocation}
                    sx={{ mt: 1 }}
                  >
                    Remove Location
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleGetLocation}
                >
                  Add Current Location
                </Button>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            {(error.create || error.update) && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error.create || error.update}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading.create || loading.update}
              >
                {loading.create || loading.update ? (
                  <CircularProgress size={24} />
                ) : isEditMode ? (
                  'Update Entry'
                ) : (
                  'Create Entry'
                )}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/diary/entries')}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};
```

## Diary Entries List Page

```typescript
// src/features/diary/pages/DiaryEntryListPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEntries, setFilters, clearFilters } from '../diarySlice';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, CalendarMonth, FormatListBulleted } from '@mui/icons-material';
import { DiaryEntryCard } from '../components/DiaryEntryCard';
import { DiaryFilterBar } from '../components/DiaryFilterBar';
import { DiaryCalendarView } from '../components/DiaryCalendarView';
import { DiaryStreakDisplay } from '../components/DiaryStreakDisplay';

enum ViewMode {
  LIST = 'list',
  CALENDAR = 'calendar',
}

export const DiaryEntryListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { entries, filters, loading, error, stats } = useSelector((state: RootState) => ({
    entries: state.diary.entries,
    filters: state.diary.filters,
    loading: state.diary.loading.entries,
    error: state.diary.error.entries,
    stats: state.diary.stats,
  }));
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  
  useEffect(() => {
    dispatch(fetchEntries(filters));
  }, [dispatch, filters]);
  
  const handleCreateEntry = () => {
    navigate('/diary/entries/new');
  };
  
  const handleViewModeChange = (event: React.SyntheticEvent, newMode: ViewMode) => {
    setViewMode(newMode);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography color="error" variant="h6">
            Error loading diary entries: {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => dispatch(fetchEntries(filters))} 
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      );
    }
    
    if (entries.length === 0) {
      return (
        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No diary entries found
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            {Object.values(filters).some(v => v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
              ? 'Try adjusting your filters'
              : 'Start documenting your thoughts and experiences'}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleCreateEntry}
          >
            Create Your First Entry
          </Button>
        </Paper>
      );
    }
    
    if (viewMode === ViewMode.CALENDAR) {
      return <DiaryCalendarView entries={entries} onEntryClick={(id) => navigate(`/diary/entries/${id}`)} />;
    }
    
    return (
      <Box>
        {entries.map(entry => (
          <DiaryEntryCard key={entry.id} entry={entry} />
        ))}
      </Box>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Diary</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleCreateEntry}
        >
          New Entry
        </Button>
      </Box>
      
      {stats && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <DiaryStreakDisplay 
            totalEntries={stats.totalEntries} 
            entriesThisMonth={stats.entriesThisMonth} 
            currentStreak={stats.currentStreak} 
          />
        </Paper>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={viewMode}
          onChange={handleViewModeChange}
          centered
        >
          <Tab 
            value={ViewMode.LIST} 
            label="List View" 
            icon={<FormatListBulleted />} 
            iconPosition="start"
          />
          <Tab 
            value={ViewMode.CALENDAR} 
            label="Calendar View" 
            icon={<CalendarMonth />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      <DiaryFilterBar 
        filters={filters} 
        onChangeFilters={(newFilters) => dispatch(setFilters(newFilters))} 
        onClearFilters={() => dispatch(clearFilters())}
      />
      
      {renderContent()}
    </Box>
  );
};
```

## Routing Configuration

```typescript
// src/App.tsx (or your routing configuration file)
import { Routes, Route } from 'react-router-dom';
import { DiaryHomePage } from './features/diary/pages/DiaryHomePage';
import { DiaryEntryListPage } from './features/diary/pages/DiaryEntryListPage';
import { DiaryEntryDetailPage } from './features/diary/pages/DiaryEntryDetailPage';
import { DiaryEntryForm } from './features/diary/components/DiaryEntryForm';
import { DiarySettingsPage } from './features/diary/pages/DiarySettingsPage';
import { DiaryStatsPage } from './features/diary/pages/DiaryStatsPage';

// Add these routes to your existing Routes component
<Routes>
  {/* Other routes */}
  <Route path="/diary" element={<DiaryHomePage />} />
  <Route path="/diary/entries" element={<DiaryEntryListPage />} />
  <Route path="/diary/entries/new" element={<DiaryEntryForm />} />
  <Route path="/diary/entries/:id" element={<DiaryEntryDetailPage />} />
  <Route path="/diary/entries/:id/edit" element={<DiaryEntryForm />} />
  <Route path="/diary/settings" element={<DiarySettingsPage />} />
  <Route path="/diary/stats" element={<DiaryStatsPage />} />
</Routes>
```

## Implementation Checklist

- [ ] Set up Redux store for diary feature
- [ ] Create API service for diary endpoints
- [ ] Implement UI components for entry management
- [ ] Create rich text editor for diary content
- [ ] Build diary entry list and grid views
- [ ] Implement calendar view for entries
- [ ] Create diary statistics dashboard
- [ ] Build reminder settings interface
- [ ] Add media upload functionality
- [ ] Implement tag management
- [ ] Create responsive layouts for all screens
- [ ] Add animations and transitions for a polished UX

## Best Practices

1. **Performance**:
   - Implement pagination for entry lists
   - Lazy load images and media content
   - Debounce search filters
   - Implement memoization for expensive computations

2. **User Experience**:
   - Add loading indicators for all async operations
   - Implement optimistic updates for immediate feedback
   - Create intuitive navigation between views
   - Add animations for state transitions
   - Implement error recovery flows

3. **Accessibility**:
   - Ensure proper contrast for text
   - Add ARIA labels for interactive elements
   - Support keyboard navigation
   - Implement focus management
   - Test with screen readers