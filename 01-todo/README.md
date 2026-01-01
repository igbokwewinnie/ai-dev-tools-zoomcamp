# Django TODO Application

A simple, functional TODO application built with Django as part of the AI Dev Tools Zoomcamp by DataTalks.Club.

## Features

✅ **Create TODOs** - Add new tasks with title and description  
✅ **Edit TODOs** - Modify existing tasks  
✅ **Delete TODOs** - Remove completed or unwanted tasks  
✅ **Due Dates** - Assign deadlines to your tasks  
✅ **Mark as Resolved** - Toggle completion status with a checkbox  
✅ **Responsive UI** - Clean Bootstrap interface that works on all devices  

## Screenshots
<img width="1920" height="1020" alt="Screenshot 2026-01-01 035607" src="https://github.com/user-attachments/assets/156a581d-6fc3-476c-8afd-cadde50ce9fb" />
*Main TODO list interface*

## Technologies Used

- **Python 3.13**
- **Django 6.0**
- **SQLite** (Database)
- **Bootstrap 5.3** (Frontend)
- **uv** (Package manager)

## Installation & Setup

### Prerequisites
- Python 3.10 or higher
- uv package manager

### Step 1: Install uv (if not already installed)

**Windows:**
```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Step 2: Clone the repository

```bash
git clone https://github.com/igbokwewinnie/ai-dev-tools-zoomcamp.git
cd ai-dev-tools-zoomcamp/01-todo
```

### Step 3: Install dependencies

```bash
uv pip install django
```

### Step 4: Run migrations

```bash
uv run python manage.py makemigrations todos
uv run python manage.py migrate
```

### Step 5: (Optional) Create a superuser for admin panel

```bash
uv run python manage.py createsuperuser
```

### Step 6: Run the development server

```bash
uv run python manage.py runserver
```

### Step 7: Access the application

Open your browser and navigate to:
- **Main App:** http://127.0.0.1:8000/
- **Admin Panel:** http://127.0.0.1:8000/admin/

## Project Structure

```
01-todo/
├── manage.py                 # Django management script
├── pyproject.toml           # Project dependencies
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── todo_project/           # Main project directory
│   ├── __init__.py
│   ├── settings.py        # Project settings
│   ├── urls.py           # Main URL configuration
│   └── wsgi.py           # WSGI configuration
└── todos/                 # TODO app directory
    ├── __init__.py
    ├── admin.py          # Admin panel configuration
    ├── apps.py           # App configuration
    ├── models.py         # Database models
    ├── forms.py          # Django forms
    ├── views.py          # View functions
    ├── urls.py           # App URL patterns
    ├── migrations/       # Database migrations
    └── templates/        # HTML templates
        └── todos/
            ├── base.html
            ├── todo_list.html
            ├── todo_form.html
            └── todo_confirm_delete.html
```

## Usage

### Creating a TODO
1. Click the **"+ New TODO"** button
2. Fill in the title, description (optional), and due date (optional)
3. Click **"Save"**

### Editing a TODO
1. Click the **"Edit"** button on any TODO card
2. Modify the fields as needed
3. Click **"Save"**

### Marking as Complete
- Simply click the **checkbox** on any TODO card to toggle its resolved status
- Resolved TODOs appear with a strikethrough style

### Deleting a TODO
1. Click the **"Delete"** button on any TODO card
2. Confirm the deletion

## Database Models

### Todo Model
```python
class Todo(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## Running Tests

```bash
uv run python manage.py test
```

## Development Notes

This project was built as part of the **AI Dev Tools Zoomcamp** where I learned to:
- Set up Django projects and applications
- Create database models and run migrations
- Implement CRUD operations (Create, Read, Update, Delete)
- Design templates with Django's template language
- Build responsive UIs with Bootstrap
- Use AI assistants effectively for development


## Acknowledgments

- **DataTalks.Club** for the AI Dev Tools Zoomcamp
