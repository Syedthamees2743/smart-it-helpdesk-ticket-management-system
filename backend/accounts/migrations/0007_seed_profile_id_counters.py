import re

from django.db import migrations
from django.db.models import Q

EMP_RE = re.compile(r'^EMP-(\d+)$')
TECH_RE = re.compile(r'^TECH-(\d+)$')


def seed_counters_and_backfill(apps, schema_editor):
    """
    Seeds the ID counters ABOVE every existing ID number, then backfills
    any profile rows with NULL/'' IDs. Existing non-empty IDs are NEVER
    modified. No data is deleted.
    """
    IDCounter = apps.get_model('accounts', 'IDCounter')
    EmployeeProfile = apps.get_model('accounts', 'EmployeeProfile')
    TechnicianProfile = apps.get_model('accounts', 'TechnicianProfile')

    targets = [
        (EmployeeProfile, 'employee_id', EMP_RE, 'EMP'),
        (TechnicianProfile, 'technician_id', TECH_RE, 'TECH'),
    ]

    for Model, field, pattern, prefix in targets:
        # 1) Highest number already used (handles legacy 3-digit EMP-001 too)
        max_number = 0
        filled = Model.objects.exclude(
            Q(**{f'{field}__isnull': True}) | Q(**{field: ''})
        ).values_list(field, flat=True)
        for value in filled:
            match = pattern.match(str(value).strip())
            if match:
                max_number = max(max_number, int(match.group(1)))

        # 2) Seed counter at/above every existing number
        counter, _ = IDCounter.objects.get_or_create(
            key=field, defaults={'value': max_number}
        )
        if counter.value < max_number:
            counter.value = max_number

        # 3) Skip past any existing ID that would collide with the next
        #    generated string (protects mixed legacy/new formats)
        while Model.objects.filter(
            **{field: f'{prefix}-{counter.value + 1:06d}'}
        ).exists():
            counter.value += 1

        # 4) Backfill profiles with NULL/'' IDs only
        missing = Model.objects.filter(
            Q(**{f'{field}__isnull': True}) | Q(**{field: ''})
        ).order_by('pk')
        for profile in missing:
            counter.value += 1
            Model.objects.filter(pk=profile.pk).update(
                **{field: f'{prefix}-{counter.value:06d}'}
            )
        counter.save(update_fields=['value'])


def unseed_counters(apps, schema_editor):
    IDCounter = apps.get_model('accounts', 'IDCounter')
    IDCounter.objects.filter(key__in=['employee_id', 'technician_id']).delete()


class Migration(migrations.Migration):

    # ⚠️ IMPORTANT: Django already wrote the correct dependency in the
    # generated file (your 0006 migration name). Keep THAT line — do not
    # use this placeholder. Check your migrations folder for the exact
    # 0006 filename and use it here.
    dependencies = [
        ('accounts', '0006_idcounter_alter_employeeprofile_employee_id_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_counters_and_backfill, unseed_counters),
    ]