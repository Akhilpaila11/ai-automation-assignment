from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.account import Account
from app.models.dealership import Dealership
from app.schemas.account import AccountCreate, AccountOut
from app.schemas.dealership import DealershipOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.post("", response_model=AccountOut)
def create_account(data: AccountCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = Account(name=data.name, owner_id=user.id)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.get("", response_model=List[AccountOut])
def list_accounts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Account).filter(Account.owner_id == user.id).all()

@router.get("/{account_id}/dealerships", response_model=List[DealershipOut])
def list_dealerships_for_account(account_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Dealership).filter(Dealership.account_id == account_id).all()
